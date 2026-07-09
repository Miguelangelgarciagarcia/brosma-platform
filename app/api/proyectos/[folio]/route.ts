import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { createProjectSchema } from '@/lib/validations/project'
import { reemplazarArbolFases } from '@/lib/phase-tree'
import { calcularFechaEntregaSugerida, fechaMasTardiaDeSubpuntos } from '@/lib/business-days'
import { esPuntoSoloEstatus, rellenarResponsablesFaltantes } from '@/lib/main-points'
import { generarOrdenTrabajoPDF } from '@/lib/pdf/generar-orden'
import { resend } from '@/lib/resend'

// Edición de un proyecto que TODAVÍA es borrador (recordStatus === 'borrador').
// Una vez registrado (folio+PDF+correo ya salieron), esta ruta se cierra a
// propósito: editar un proyecto ya registrado es un caso distinto (implica
// avisar al cliente de cambios) que no está cubierto todavía.
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

        if (existente.recordStatus !== 'borrador') {
            return NextResponse.json(
                { error: 'Este proyecto ya fue registrado y no se puede editar desde aquí' },
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

        const mainPointsSoloEstatus = data.mainPoints.map((p) =>
            esPuntoSoloEstatus(p.mainPointKey)
                ? { ...p, responsibleId: session.user!.id, estimatedDays: 0, children: undefined }
                : p
        )
        // Cualquier subpunto (o punto principal) que se haya quedado sin
        // responsable porque el proyecto sigue como borrador se rellena con
        // el Admin que guarda, solo para no violar la FK. Se reemplaza en
        // cuanto el propio Admin le asigne el responsable real y vuelva a guardar.
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

        const project = await prisma.project.update({
            where: { id: existente.id },
            data: {
                recordStatus: data.recordStatus,
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
                estimatedDeliveryManual: data.estimatedDeliveryManual
                    ? new Date(data.estimatedDeliveryManual)
                    : null,
                clientCanSeeSubpoints: data.clientCanSeeSubpoints,
            },
        })

        // Se reemplaza el árbol completo: el Admin pudo haber movido,
        // borrado o agregado subpuntos libremente mientras era borrador.
        await reemplazarArbolFases(project.id, mainPoints)

        await prisma.statusHistory.create({
            data: {
                projectId: project.id,
                status: data.recordStatus === 'registrado' ? 'registrado' : 'borrador',
                note:
                    data.recordStatus === 'registrado'
                        ? 'Proyecto registrado en el sistema (editado desde borrador)'
                        : 'Borrador actualizado',
                changedById: session.user.id,
            },
        })

        let emailEnviado = false
        let emailError: string | null = null

        // Como esta ruta solo se puede llamar mientras el proyecto seguía
        // siendo borrador, si aquí llega recordStatus 'registrado' es
        // necesariamente la primera vez que se registra -> mismo flujo de
        // PDF + correo que al crearlo de una sola vez.
        if (data.recordStatus === 'registrado' && project.email) {
            try {
                const pdfBuffer = await generarOrdenTrabajoPDF(project.id)
                await resend.emails.send({
                    from: process.env.RESEND_FROM!,
                    to: project.email,
                    subject: `Brosma - Orden de trabajo ${folio}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                            <h2 style="color: #000;">Hola ${project.clientName} 👋</h2>
                            <p>Gracias por confiar en <strong>Brosma</strong>. Hemos registrado tu proyecto "${project.title}" correctamente.</p>
                            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                <p style="margin: 0 0 4px; color: #666; font-size: 12px;">FOLIO DE SEGUIMIENTO</p>
                                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace;">${folio}</p>
                            </div>
                            <p>Adjunto encontrarás tu orden de trabajo con los detalles del proyecto.</p>
                            <p style="color: #666; font-size: 12px; margin-top: 24px;">
                                Brosma · Este es un mensaje automático, por favor no respondas a este correo.
                            </p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `orden-${folio}.pdf`,
                            content: pdfBuffer,
                        },
                    ],
                })
                emailEnviado = true
            } catch (err) {
                console.error('Error enviando correo de registro:', err)
                emailError = 'El proyecto se registró bien, pero no se pudo enviar el correo al cliente.'
            }
        }

        return NextResponse.json({ folio: project.folio, emailEnviado, emailError })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al editar el proyecto' }, { status: 500 })
    }
}
