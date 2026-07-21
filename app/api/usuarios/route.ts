import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { generarTokenVerificacion, enviarCorreoVerificacion } from '@/lib/verification'

// Lista de usuarios internos (para asignar responsables, gestionar cuentas, etc).
// Solo Admin puede ver el listado completo.
export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const usuarios = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json(usuarios)
}

const crearUsuarioSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(200),
    role: z.enum(['admin', 'trabajador']),
})

// Alta de cuentas internas (Admin o Trabajador). Solo un Admin autenticado
// puede crear cuentas nuevas.
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const json = await req.json()
        const parsed = crearUsuarioSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            )
        }
        const { name, email, password, role } = parsed.data

        const existe = await prisma.user.findUnique({ where: { email } })
        if (existe) {
            return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 })
        }

        const hash = await bcrypt.hash(password, 12)

        const nuevo = await prisma.user.create({
            data: { name, email, password: hash, role },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        })

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'user_created',
                targetType: 'User',
                targetId: nuevo.id,
                metadata: { email: nuevo.email, role: nuevo.role },
            },
        })

        // El envío del correo de verificación nunca debe tumbar la creación
        // de la cuenta: si Resend falla, la cuenta ya quedó creada y un
        // Admin puede reenviar el correo después desde Configuración.
        let correoEnviado = true
        try {
            const rawToken = await generarTokenVerificacion(nuevo.id)
            await enviarCorreoVerificacion(nuevo, rawToken)
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'verification_email_sent',
                    targetType: 'User',
                    targetId: nuevo.id,
                },
            })
        } catch (err) {
            console.error('Error al enviar correo de verificación:', err)
            correoEnviado = false
        }

        return NextResponse.json({ ...nuevo, correoVerificacionEnviado: correoEnviado }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
    }
}
