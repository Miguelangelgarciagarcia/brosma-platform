import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, loginRateLimiter } from '@/lib/ratelimit'

const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 15

// Subclase con `code` propio: next-auth/react la expone como `res.code` en
// el cliente (con redirect:false), así la pantalla de login puede mostrar
// un mensaje específico para este caso sin tocar el resto de los mensajes
// genéricos (que a propósito no distinguen "no existe" de "password
// incorrecto", para no filtrar qué correos están registrados).
class EmailNoVerificadoError extends CredentialsSignin {
    code = 'email_no_verificado'
}

// Toda entrada de usuario se valida en el servidor con Zod, nunca se confía
// solo en la validación del formulario del cliente.
const credentialsSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(200),
})

async function registrarAuditoria(
    userId: string | null,
    action: string,
    metadata?: Record<string, unknown>
) {
    try {
        await prisma.auditLog.create({
            // Prisma tipa el JSON de forma estricta (InputJsonValue); metadata
            // aquí siempre es un objeto plano serializable, se castea nada más
            // para el tipado.
            data: { userId, action, metadata: metadata as any },
        })
    } catch {
        // La auditoría nunca debe tumbar el login; si falla, solo se ignora.
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, request) {
                // Throttle por IP además del bloqueo por cuenta de abajo: esto
                // frena el credential-stuffing (probar muchas cuentas distintas
                // desde la misma IP), cosa que el bloqueo por cuenta no cubre.
                // Si no hay Upstash configurado (dev), checkRateLimit no bloquea.
                const ip =
                    request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
                const { success } = await checkRateLimit(loginRateLimiter, ip)
                if (!success) {
                    await registrarAuditoria(null, 'login_rate_limited', { ip })
                    return null
                }

                const parsed = credentialsSchema.safeParse(credentials)
                if (!parsed.success) return null

                const { email, password } = parsed.data

                const user = await prisma.user.findUnique({ where: { email } })

                // Mismo mensaje/comportamiento exista o no el usuario,
                // para no filtrar qué correos están registrados.
                if (!user) {
                    await registrarAuditoria(null, 'login_failed', { email, reason: 'no_existe' })
                    return null
                }

                // Cuenta bloqueada temporalmente por intentos fallidos
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    await registrarAuditoria(user.id, 'login_failed', { reason: 'cuenta_bloqueada' })
                    return null
                }

                const passwordMatch = await bcrypt.compare(password, user.password)

                if (!passwordMatch) {
                    const intentos = user.failedLoginAttempts + 1
                    const bloquear = intentos >= MAX_INTENTOS

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: bloquear ? 0 : intentos,
                            lockedUntil: bloquear
                                ? new Date(Date.now() + BLOQUEO_MINUTOS * 60_000)
                                : null,
                        },
                    })

                    await registrarAuditoria(user.id, 'login_failed', {
                        reason: 'password_incorrecto',
                        intentos,
                        bloqueado: bloquear,
                    })
                    return null
                }

                // Password correcto pero todavía no confirma su correo: no
                // se cuenta como intento fallido (la contraseña sí era
                // correcta), solo se corta aquí antes de abrir sesión.
                if (!user.emailVerified) {
                    await registrarAuditoria(user.id, 'login_failed', { reason: 'email_no_verificado' })
                    throw new EmailNoVerificadoError()
                }

                // Login exitoso: resetear contador de intentos
                await prisma.user.update({
                    where: { id: user.id },
                    data: { failedLoginAttempts: 0, lockedUntil: null },
                })

                await registrarAuditoria(user.id, 'login_success')

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8 horas: sesiones cortas por seguridad (sin 2FA por ahora)
    },
    pages: {
        signIn: '/login',
    },
    // Cookies reforzadas: httpOnly (no accesible por JS/XSS), sameSite=lax
    // (evita que la sesión viaje en requests cross-site) y secure en producción.
    cookies: {
        sessionToken: {
            name:
                process.env.NODE_ENV === 'production'
                    ? '__Secure-authjs.session-token'
                    : 'authjs.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    trustHost: true,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
})
