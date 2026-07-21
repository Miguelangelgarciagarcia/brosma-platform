import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { generarTokenVerificacion, enviarCorreoVerificacion } from '@/lib/verification'

// Reenvía el correo de verificación a una cuenta que todavía no confirma su
// correo (link vencido o correo perdido). Solo un Admin puede dispararlo,
// desde Configuración → Usuarios.
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const { id } = await params
        const usuario = await prisma.user.findUnique({ where: { id } })
        if (!usuario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        if (usuario.emailVerified) {
            return NextResponse.json({ error: 'Esta cuenta ya verificó su correo' }, { status: 400 })
        }

        const rawToken = await generarTokenVerificacion(usuario.id)
        await enviarCorreoVerificacion(usuario, rawToken)

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'verification_email_resent',
                targetType: 'User',
                targetId: usuario.id,
            },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al reenviar el correo de verificación' }, { status: 500 })
    }
}
