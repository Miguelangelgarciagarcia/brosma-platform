import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
    status: z.enum(['pendiente', 'en_proceso', 'completado']),
})

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = await params
        const json = await req.json()
        const parsed = bodySchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Estatus inválido' }, { status: 400 })
        }

        const fase = await prisma.phase.findUnique({ where: { id } })
        if (!fase) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        // Validación de cierre: solo el trabajador asignado como responsable
        // de ESTE punto específico (o un Admin, como válvula de seguridad
        // operativa) puede cambiar su estatus.
        const esResponsable = fase.responsibleId === session.user.id
        const esAdmin = session.user.role === 'admin'
        if (!esResponsable && !esAdmin) {
            return NextResponse.json(
                { error: 'Solo el responsable asignado a este punto puede actualizarlo' },
                { status: 403 }
            )
        }

        const nuevoStatus = parsed.data.status

        // Reglas especiales de negocio para los puntos "solo estatus":
        // - "Listo para Entrega" solo se puede completar si TODOS los demás
        //   puntos/subpuntos del proyecto (excepto "Entregado") ya están
        //   completados, sin excepción.
        // - "Entregado" solo se puede completar si "Listo para Entrega" ya
        //   está completado.
        // El resto de los puntos (1-4) se pueden completar salteados, sin
        // ninguna restricción de orden.
        if (nuevoStatus === 'completado') {
            if (fase.mainPointKey === 'listo_entrega') {
                const pendientes = await prisma.phase.count({
                    where: {
                        projectId: fase.projectId,
                        id: { not: fase.id },
                        mainPointKey: { not: 'entregado' },
                        status: { not: 'completado' },
                    },
                })
                if (pendientes > 0) {
                    return NextResponse.json(
                        {
                            error: `Faltan ${pendientes} punto(s)/subpunto(s) por completar antes de marcar "Listo para Entrega"`,
                        },
                        { status: 400 }
                    )
                }
            }

            if (fase.mainPointKey === 'entregado') {
                const listoEntrega = await prisma.phase.findFirst({
                    where: { projectId: fase.projectId, mainPointKey: 'listo_entrega' },
                })
                if (!listoEntrega || listoEntrega.status !== 'completado') {
                    return NextResponse.json(
                        { error: 'Primero debes marcar "Listo para Entrega" como completado' },
                        { status: 400 }
                    )
                }
            }
        }

        await prisma.phase.update({
            where: { id },
            data: {
                status: nuevoStatus,
                completedAt: nuevoStatus === 'completado' ? new Date() : null,
            },
        })

        await prisma.statusHistory.create({
            data: {
                projectId: fase.projectId,
                phaseId: fase.id,
                status: nuevoStatus,
                note: `"${fase.title}" marcado como ${nuevoStatus}`,
                changedById: session.user.id,
            },
        })

        // Si el punto principal "Entregado" se completa, el proyecto pasa a
        // entregado (alimenta los contadores del dashboard y el historial).
        if (fase.mainPointKey === 'entregado' && nuevoStatus === 'completado') {
            await prisma.project.update({
                where: { id: fase.projectId },
                data: { status: 'entregado', deliveredAt: new Date() },
            })
            await prisma.statusHistory.create({
                data: {
                    projectId: fase.projectId,
                    status: 'entregado',
                    note: 'Proyecto marcado como entregado',
                    changedById: session.user.id,
                },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar el punto' }, { status: 500 })
    }
}
