import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { createProjectSchema } from '@/lib/validations/project'
import { actualizarArbolFasesPreservandoProgreso } from '@/lib/phase-tree'
import { calcularFechaEntregaSugerida, fechaMasTardiaDeSubpuntos } from '@/lib/business-days'
import { esPuntoSoloEstatus, rellenarResponsablesFaltantes } from '@/lib/main-points'
import { resend } from '@/lib/resend'

// Edición de un proyecto YA REGISTRADO. A propósito es una ruta separada de
// la de borrador (app/api/proyectos/[folio]/route.ts): aquí NUNCA se borra
// y recrea el árbol de fases (se perdería el progreso que ya marcaron los
// trabajadores), y se puede avisar al cliente por correo si cambió algo
// sensible (fecha de entrega o datos de pago).
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Solo un Administrador puede editar proyectos' }, { status: 403 })
        }

        const { folio } = await params

        const existente = await prisma.project.findUnique({ where: { folio } })
        if (!existente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        if (existente.recordStatus !== 'registrado') {
            return NextResponse.json(
                { error: 'Este proyecto sigue como borrador, edítalo desde esa pantalla' },
                { status: 409 }
            )
        }

        const json = await req.json()
        const parsed = createProjectSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: 'Datos inválidos',
                    detalles: parsed.error.flatten(),
                    issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
                },
                { status: 400 }
            )
        }
        const data = parsed.data

        // Campos extra que no son parte del proyecto en sí, solo de esta
        // ruta: si el Admin confirmó el envío del aviso al cliente, y con
        // qué mensaje (lo revisó/editó en la vista previa del modal).
        const notificarCliente = json?.notificarCliente === true
        const mensajeCorreo: string = typeof json?.mensajeCorreo === 'string' ? json.mensajeCorreo : ''

        const mainPointsSoloEstatus = data.mainPoints.map((p) =>
            esPuntoSoloEstatus(p.mainPointKey)
                ? { ...p, responsibleId: session.user!.id, estimatedDays: 0, children: undefined }
                : p
        )
        const mainPoints = mainPointsSoloEstatus.map((p) => ({
            ...p,
            responsibleId: p.responsibleId || session.user!.id,
            children: p.children ? rellenarResponsablesFaltantes(p.children, session.user!.id) : p.children,
        }))

        const idsResponsables = new Set<string>()
        function recolectarIds(nodes: { responsibleId: string; children?: any[] }[]) {
            for (const n of nodes) {
                idsResponsables.add(n.responsibleId)
                if (n.children) recolectarIds(n.children)
            }
        }
        recolectarIds(mainPoints)

        const usuariosExistentes = await prisma.user.findMany({
            where: { id: { in: Array.from(idsResponsables) } },
            select: { id: true },
        })
        const idsValidos = new Set(usuariosExistentes.map((t) => t.id))
        const idsInvalidos = Array.from(idsResponsables).filter((id) => !idsValidos.has(id))
        if (idsInvalidos.length > 0) {
            return NextResponse.json(
                { error: 'Uno o más responsables asignados no existen' },
                { status: 400 }
            )
        }

        const puntosConTrabajo = mainPoints.filter((p) => !esPuntoSoloEstatus(p.mainPointKey))
        const estimatedDeliveryAuto =
            fechaMasTardiaDeSubpuntos(puntosConTrabajo.flatMap((p) => p.children || [])) ??
            calcularFechaEntregaSugerida(puntosConTrabajo.map((p) => p.estimatedDays))

        const nuevaEntregaManual = data.estimatedDeliveryManual ? new Date(data.estimatedDeliveryManual) : null

        // Para la bitácora: qué cambió de verdad (independiente de si se
        // avisa o no al cliente).
        const entregaAnterior = existente.estimatedDeliveryManual ?? existente.estimatedDeliveryAuto
        const entregaNueva = nuevaEntregaManual ?? estimatedDeliveryAuto
        const cambioEntrega = entregaAnterior?.getTime() !== entregaNueva?.getTime()
        const cambioPago =
            (existente.cost ?? null) !== (data.cost ?? null) ||
            (existente.advancePayment ?? null) !== (data.advancePayment ?? null) ||
            existente.paymentStatus !== data.paymentStatus

        const project = await prisma.project.update({
            where: { id: existente.id },
            data: {
                title: data.title,
                clientName: data.clientName,
                company: data.company || null,
                phone: data.phone,
                email: data.email || null,
                cost: data.cost ?? null,
                advancePayment: data.advancePayment ?? 0,
                paymentStatus: data.paymentStatus,
                notes: data.notes || null,
                clientSignature: data.clientSignature || null,
                receiverSignature: data.receiverSignature || null,
                estimatedDeliveryAuto,
                estimatedDeliveryManual: nuevaEntregaManual,
                clientCanSeeSubpoints: data.clientCanSeeSubpoints,
                // recordStatus/status/folio/createdById nunca se tocan aquí.
            },
        })

        await actualizarArbolFasesPreservandoProgreso(project.id, mainPoints)

        await prisma.statusHistory.create({
            data: {
                projectId: project.id,
                status: 'registrado',
                note:
                    'Proyecto editado' +
                    (cambioEntrega ? ' · cambió la fecha de entrega' : '') +
                    (cambioPago ? ' · cambiaron los datos de pago' : '') +
                    (notificarCliente ? ' · se avisó al cliente por correo' : ''),
                changedById: session.user.id,
            },
        })

        let emailEnviado = false
        let emailError: string | null = null

        if (notificarCliente && project.email && mensajeCorreo.trim()) {
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM!,
                    to: project.email,
                    subject: `Brosma - Actualización de tu proyecto ${folio}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                            <h2 style="color: #000;">Hola ${project.clientName} 👋</h2>
                            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                <p style="margin: 0 0 4px; color: #666; font-size: 12px;">FOLIO</p>
                                <p style="margin: 0; font-size: 18px; font-weight: bold; font-family: monospace;">${folio}</p>
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
                        projectId: project.id,
                        status: 'registrado',
                        note: 'Correo de aviso enviado al cliente por modificación',
                        changedById: session.user.id,
                    },
                })
            } catch (err) {
                console.error('Error enviando correo de aviso de cambios:', err)
                emailError = 'Los cambios se guardaron bien, pero no se pudo enviar el correo al cliente.'
            }
        }

        return NextResponse.json({ folio: project.folio, emailEnviado, emailError, cambioEntrega, cambioPago })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al editar el proyecto' }, { status: 500 })
    }
}
