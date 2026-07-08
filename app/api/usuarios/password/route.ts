import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
})

// Cambio de contraseña propio. Disponible para Admin y Trabajador por igual
// (cada quien solo puede cambiar la suya, nunca la de otro usuario).
export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const json = await req.json()
        const parsed = bodySchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            )
        }
        const { currentPassword, newPassword } = parsed.data

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const passwordMatch = await bcrypt.compare(currentPassword, user.password)
        if (!passwordMatch) {
            await prisma.auditLog.create({
                data: { userId: user.id, action: 'password_change_failed', metadata: { reason: 'password_actual_incorrecto' } },
            })
            return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
        }

        if (newPassword === currentPassword) {
            return NextResponse.json(
                { error: 'La nueva contraseña debe ser diferente a la actual' },
                { status: 400 }
            )
        }

        const hash = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

        await prisma.auditLog.create({
            data: { userId: user.id, action: 'password_changed' },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 })
    }
}
