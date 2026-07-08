import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 15

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
            data: { userId, action, metadata },
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
            async authorize(credentials) {
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
