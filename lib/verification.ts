import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'

// Verificación de correo al crear una cuenta interna (Admin/Trabajador). El
// token nunca se guarda en crudo en la base de datos: se genera un valor
// aleatorio, se manda por correo tal cual, y solo su hash (sha256) se
// guarda en VerificationToken.tokenHash — mismo principio que la
// contraseña (bcrypt): un dump de la base no sirve para armar un link
// válido.
const HORAS_VIGENCIA = 48

function hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex')
}

function urlBase(): string {
    return process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'
}

// Genera un token nuevo para el usuario y lo guarda (hasheado). No borra
// tokens anteriores todavía vigentes: si se reenvía el correo antes de que
// expire el primero, cualquiera de los dos links sirve, sin invalidar el
// que ya se mandó.
export async function generarTokenVerificacion(userId: string): Promise<string> {
    const raw = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
        data: {
            userId,
            tokenHash: hashToken(raw),
            expiresAt: new Date(Date.now() + HORAS_VIGENCIA * 60 * 60 * 1000),
        },
    })
    return raw
}

// Mismo estilo de plantilla que ya usan los correos de proyectos
// (app/api/proyectos/route.ts, etc.): marca Brosma, tarjeta gris para el
// dato importante, footer de "mensaje automático".
export async function enviarCorreoVerificacion(
    user: { name: string; email: string },
    rawToken: string
) {
    const link = `${urlBase()}/verificar-correo?token=${rawToken}`

    await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: user.email,
        subject: 'Brosma - Confirma tu correo',
        html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #000;">Hola ${user.name} 👋</h2>
                <p>Se creó una cuenta interna de <strong>Brosma</strong> con este correo. Confirma que es tuyo para poder iniciar sesión:</p>
                <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                    <a href="${link}" style="display: inline-block; background: #f47b30; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                        Confirmar mi correo
                    </a>
                </div>
                <p style="color: #666; font-size: 12px;">Este link vence en ${HORAS_VIGENCIA} horas. Si no lo usas a tiempo, pide a un Administrador que te lo reenvíe desde Configuración.</p>
                <p style="color: #666; font-size: 12px; margin-top: 24px;">
                    Brosma · Este es un mensaje automático, por favor no respondas a este correo.
                </p>
            </div>
        `,
    })
}

type ResultadoVerificacion =
    | { ok: true; userId: string }
    | { ok: false; error: 'invalido_o_expirado' }

// Valida el token recibido en el link: lo hashea, busca coincidencia
// vigente, marca al usuario como verificado y limpia todos sus tokens
// pendientes (el usado y cualquier otro que hubiera quedado de un reenvío
// anterior).
export async function verificarToken(rawToken: string): Promise<ResultadoVerificacion> {
    const tokenHash = hashToken(rawToken)

    const token = await prisma.verificationToken.findUnique({
        where: { tokenHash },
    })

    if (!token || token.expiresAt < new Date()) {
        return { ok: false, error: 'invalido_o_expirado' }
    }

    await prisma.user.update({
        where: { id: token.userId },
        data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.deleteMany({ where: { userId: token.userId } })

    return { ok: true, userId: token.userId }
}
