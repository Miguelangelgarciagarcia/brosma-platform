import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resend } from '@/lib/resend'
import { esPuntoSoloEstatus } from '@/lib/main-points'

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

        // Campos extra fuera del schema (no aplican a todos los puntos, solo
        // a "Listo para Entrega"): si el Admin/trabajador confirmó avisarle
        // al cliente por correo, y con qué mensaje (revisado/editado en la
        // vista previa del modal).
        const notificarCliente = json?.notificarCliente === true
        const mensajeCorreo: string = typeof json?.mensajeCorreo === 'string' ? json.mensajeCorreo : ''

        // No se puede pasar directo de "pendiente" a "completado": primero
        // hay que iniciarlo. Esto no aplica a los puntos "solo estatus"
        // (Listo para Entrega / Entregado), que no tienen paso de "Iniciar".
        if (
            nuevoStatus === 'completado' &&
            fase.status === 'pendiente' &&
            !esPuntoSoloEstatus(fase.mainPointKey || '')
        ) {
            return NextResponse.json(
                { error: 'Primero debes marcar este punto como iniciado antes de terminarlo' },
                { status: 400 }
            )
        }

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

        // Avisar al cliente por correo de que ya está listo para entrega es
        // opcional: el Admin/trabajador lo decide en el modal de
        // confirmación, y puede editar el mensaje antes de mandarlo.
        let emailEnviado = false
        let emailError: string | null = null

        if (fase.mainPointKey === 'listo_entrega' && nuevoStatus === 'completado' && notificarCliente) {
            const proyecto = await prisma.project.findUnique({ where: { id: fase.projectId } })
            if (proyecto?.email && mensajeCorreo.trim()) {
                try {
                    await resend.emails.send({
                        from: process.env.RESEND_FROM!,
                        to: proyecto.email,
                        subject: `Brosma - Tu proyecto ${proyecto.folio} ya está listo para entrega`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                                <h2 style="color: #000;">Hola ${proyecto.clientName} 👋</h2>
                                <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                    <p style="margin: 0 0 4px; color: #666; font-size: 12px;">FOLIO</p>
                                    <p style="margin: 0; font-size: 18px; font-weight: bold; font-family: monospace;">${proyecto.folio}</p>
                                </div>
                                <p style="white-space: pre-line;">${mensajeCorreo.replace(/</g, '&lt;')}</p>
                                <p style="color: #666; font-size: 12px; margin-top: 24px;">
                                    Brosma · Este es un mensaje automático, por favor no respondas a este correo.
                                </p>
                            </div>
                        `,
                    })
                    emailEnviado = true
                    await prisma.statusHistory.create({
                        data: {
                            projectId: fase.projectId,
                            status: nuevoStatus,
                            note: 'Correo de aviso enviado al cliente: proyecto listo para entrega',
                            changedById: session.user.id,
                        },
                    })
                } catch (err) {
                    console.error('Error enviando correo de listo para entrega:', err)
                    emailError = 'El punto se marcó como completado, pero no se pudo enviar el correo al cliente.'
                }
            }
        }

        return NextResponse.json({ ok: true, emailEnviado, emailError })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar el punto' }, { status: 500 })
    }
}
