import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { createProjectSchema } from '@/lib/validations/project'
import { crearArbolFases } from '@/lib/phase-tree'
import { generarFolioUnico } from '@/lib/folio'
import { calcularFechaEntregaSugerida, fechaMasTardiaDeSubpuntos } from '@/lib/business-days'
import { esPuntoSoloEstatus, rellenarResponsablesFaltantes } from '@/lib/main-points'
import { generarOrdenTrabajoPDF } from '@/lib/pdf/generar-orden'
import { resend } from '@/lib/resend'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Solo un Administrador puede registrar proyectos' }, { status: 403 })
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

        // Normaliza los puntos "solo estatus": ignora cualquier
        // responsable/días/subpuntos que haya mandado el cliente y fuerza
        // al Administrador que registra como responsable técnico (no se
        // expone en el formulario, es solo para satisfacer la FK).
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

        // Todos los responsables (de los puntos con trabajo real) deben ser
        // trabajadores existentes.
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

        // Al registrar en definitiva, ningún punto de trabajo puede quedar
        // vacío: necesita al menos un subpunto (1.1). Esto ya se valida en
        // el formulario, pero se resguarda también aquí por si algo llega
        // directo a la API. No aplica a "Listo para Entrega"/"Entregado",
        // que nunca llevan subpuntos.
        if (data.recordStatus === 'registrado') {
            const puntosVacios = mainPoints.filter(
                (p) => !esPuntoSoloEstatus(p.mainPointKey) && (!p.children || p.children.length === 0)
            )
            if (puntosVacios.length > 0) {
                return NextResponse.json(
                    {
                        error: `No puedes registrar el proyecto con puntos vacíos. Agrega al menos un subpunto (1.1) en: ${puntosVacios
                            .map((p) => p.title)
                            .join(', ')}`,
                    },
                    { status: 400 }
                )
            }
        }

        const folio = await generarFolioUnico()

        // Solo los puntos con trabajo real (los primeros 4) cuentan para la
        // fecha de entrega sugerida. Es la fecha de fin más tardía entre
        // todos sus subpuntos (a cualquier profundidad); si aún no hay
        // ninguna fecha capturada (ej. borrador temprano), se cae de
        // respaldo al cálculo por suma de días hábiles.
        const puntosConTrabajo = mainPoints.filter((p) => !esPuntoSoloEstatus(p.mainPointKey))
        const maximaFechaSubpuntos = fechaMasTardiaDeSubpuntos(puntosConTrabajo.flatMap((p) => p.children || []))
        const estimatedDeliveryAuto = maximaFechaSubpuntos ?? calcularFechaEntregaSugerida(puntosConTrabajo.map((p) => p.estimatedDays))

        // La fecha de entrega (si se ajustó a mano) no puede quedar antes de
        // que termine el subpunto que más tarda. Solo aplica al registrar en
        // definitiva; guardar como borrador puede quedar inconsistente
        // mientras se sigue editando.
        const entregaManual = data.estimatedDeliveryManual ? new Date(data.estimatedDeliveryManual) : null
        if (data.recordStatus === 'registrado' && entregaManual && maximaFechaSubpuntos && entregaManual < maximaFechaSubpuntos) {
            return NextResponse.json(
                {
                    error: `La fecha de entrega no puede ser anterior al ${maximaFechaSubpuntos.toLocaleDateString(
                        'es-MX'
                    )}, que es cuando termina el subpunto que más tarda.`,
                },
                { status: 400 }
            )
        }

        const project = await prisma.project.create({
            data: {
                folio,
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
                estimatedDeliveryManual: entregaManual,
                clientCanSeeSubpoints: data.clientCanSeeSubpoints,
                status: 'en_proceso',
                createdById: session.user.id,
            },
        })

        await crearArbolFases(project.id, mainPoints)

        await prisma.statusHistory.create({
            data: {
                projectId: project.id,
                status: data.recordStatus === 'registrado' ? 'registrado' : 'borrador',
                note:
                    data.recordStatus === 'registrado'
                        ? 'Proyecto registrado en el sistema'
                        : 'Proyecto guardado como borrador',
                changedById: session.user.id,
            },
        })

        // Si se registra de forma definitiva y el cliente dejó correo,
        // generamos el PDF y se lo mandamos por Resend. Un fallo aquí NO debe
        // tumbar el registro (el proyecto ya se guardó bien); solo avisamos.
        let emailEnviado = false
        let emailError: string | null = null

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

        return NextResponse.json(
            { folio: project.folio, emailEnviado, emailError },
            { status: 201 }
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al registrar el proyecto' }, { status: 500 })
    }
}
