import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import ProyectoForm, { ProyectoFormInitialData } from '@/components/admin/ProyectoForm'
import { SubpointNode } from '@/components/admin/SubpointEditor'
import { esPuntoSoloEstatus } from '@/lib/main-points'

type PhaseFlat = {
    id: string
    parentId: string | null
    depth: number
    order: number
    mainPointKey: string | null
    title: string
    description: string | null
    responsibleId: string
    startDate: Date | null
    endDate: Date | null
}

// Convierte una fecha guardada (medianoche UTC del día elegido) de vuelta al
// string "YYYY-MM-DD" que espera un <input type="date">. Usar toISOString
// (siempre UTC) evita el bug de que se recorra un día según el huso horario
// del servidor.
function toDateInputValue(d: Date | null): string {
    if (!d) return ''
    return d.toISOString().slice(0, 10)
}

function buildSubpointTree(phases: PhaseFlat[], parentId: string): SubpointNode[] {
    return phases
        .filter((p) => p.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((p) => ({
            clientId: p.id,
            title: p.title,
            description: p.description || '',
            responsibleId: p.responsibleId,
            startDate: toDateInputValue(p.startDate),
            endDate: toDateInputValue(p.endDate),
            children: buildSubpointTree(phases, p.id),
        }))
}

export default async function EditarProyectoPage({
    params,
}: {
    params: Promise<{ folio: string }>
}) {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    const { folio } = await params

    const project = await prisma.project.findUnique({
        where: { folio },
        include: { phases: true },
    })

    if (!project) notFound()

    // Solo se puede editar mientras siga como borrador. Una vez registrado,
    // ya se generó folio/PDF/correo y esta pantalla no aplica.
    if (project.recordStatus !== 'borrador') {
        redirect(`/admin/proyecto/${folio}`)
    }

    const phases = project.phases as PhaseFlat[]
    const mainPointPhases = phases.filter((p) => p.depth === 0)

    const mainPoints = mainPointPhases
        .sort((a, b) => a.order - b.order)
        .map((mp) => ({
            mainPointKey: mp.mainPointKey || '',
            title: mp.title,
            responsibleId: esPuntoSoloEstatus(mp.mainPointKey || '') ? '' : mp.responsibleId,
            children: buildSubpointTree(phases, mp.id),
        }))

    const initial: ProyectoFormInitialData = {
        title: project.title,
        clientName: project.clientName,
        company: project.company || '',
        phone: project.phone,
        email: project.email || '',
        cost: project.cost != null ? String(project.cost) : '',
        advancePayment: project.advancePayment != null ? String(project.advancePayment) : '',
        notes: project.notes || '',
        estimatedDeliveryManual: toDateInputValue(project.estimatedDeliveryManual),
        clientCanSeeSubpoints: project.clientCanSeeSubpoints,
        clientSignature: project.clientSignature || '',
        receiverSignature: project.receiverSignature || '',
        mainPoints,
    }

    return <ProyectoForm mode="editar" folio={folio} initial={initial} />
}
