import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
    label: z.string().trim().min(1).max(80).optional(),
    active: z.boolean().optional(),
    move: z.enum(['up', 'down']).optional(),
})

// Renombrar, activar/desactivar (soft-delete, nunca se borra de verdad), o
// reordenar (mover arriba/abajo entre los demás puntos configurables) un
// punto del catálogo. Los 2 puntos fijos (Listo para Entrega / Entregado)
// están protegidos: nunca se pueden tocar desde aquí.
//
// Nada de esto afecta proyectos ya existentes (ni registrados ni
// borradores): el catálogo es solo una plantilla que se copia al crear un
// proyecto nuevo.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const { id } = await params
        const json = await req.json()
        const parsed = patchSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            )
        }

        const punto = await prisma.mainPointTemplate.findUnique({ where: { id } })
        if (!punto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        if (punto.fixed) {
            return NextResponse.json(
                { error: 'Este punto es fijo y no se puede modificar' },
                { status: 400 }
            )
        }

        const { label, active, move } = parsed.data

        if (move) {
            const configurables = await prisma.mainPointTemplate.findMany({
                where: { fixed: false },
                orderBy: { order: 'asc' },
            })
            const idx = configurables.findIndex((p) => p.id === id)
            const vecinoIdx = move === 'up' ? idx - 1 : idx + 1
            if (idx === -1 || vecinoIdx < 0 || vecinoIdx >= configurables.length) {
                return NextResponse.json(
                    { error: 'No se puede mover más en esa dirección' },
                    { status: 400 }
                )
            }
            const vecino = configurables[vecinoIdx]
            await prisma.$transaction([
                prisma.mainPointTemplate.update({ where: { id: punto.id }, data: { order: vecino.order } }),
                prisma.mainPointTemplate.update({ where: { id: vecino.id }, data: { order: punto.order } }),
            ])
        }

        if (label !== undefined || active !== undefined) {
            await prisma.mainPointTemplate.update({
                where: { id },
                data: {
                    ...(label !== undefined ? { label } : {}),
                    ...(active !== undefined ? { active } : {}),
                },
            })
        }

        const actualizado = await prisma.mainPointTemplate.findUnique({ where: { id } })

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'main_point_template_updated',
                targetType: 'MainPointTemplate',
                targetId: id,
                metadata: { label: label ?? null, active: active ?? null, move: move ?? null },
            },
        })

        return NextResponse.json(actualizado)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar el punto' }, { status: 500 })
    }
}
