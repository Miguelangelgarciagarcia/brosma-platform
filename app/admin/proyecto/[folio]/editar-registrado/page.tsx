import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import ProyectoRegistradoForm, { ProyectoRegistradoFormInitialData } from '@/components/admin/ProyectoRegistradoForm'
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
    status: string
}

// Igual que en editar/page.tsx (borrador), pero aquí SÍ importa guardar el
// `id` real de cada fase: la reconciliación en el backend
// (actualizarArbolFasesPreservandoProgreso) lo necesita para saber qué
// subpuntos actualizar en su lugar vs. cuáles son nuevos, y así no perder
// el progreso que ya haya marcado un trabajador.
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
            id: p.id,
            status: p.status,
            title: p.title,
            description: p.description || '',
            responsibleId: p.responsibleId,
            startDate: toDateInputValue(p.startDate),
            endDate: toDateInputValue(p.endDate),
            children: buildSubpointTree(phases, p.id),
        }))
}

export default async function EditarProyectoRegistradoPage({
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

    // Esta pantalla es solo para proyectos YA registrados. Si sigue como
    // borrador, se edita desde /editar (independiente a propósito).
    if (project.recordStatus !== 'registrado') {
        redirect(`/admin/proyecto/${folio}/editar`)
    }

    const phases = project.phases as PhaseFlat[]
    const mainPointPhases = phases.filter((p) => p.depth === 0)

    const mainPoints = mainPointPhases
        .sort((a, b) => a.order - b.order)
        .map((mp) => ({
            mainPointKey: mp.mainPointKey || '',
            title: mp.title,
            responsibleId: esPuntoSoloEstatus(mp.mainPointKey || '') ? '' : mp.responsibleId,
            status: mp.status,
            children: buildSubpointTree(phases, mp.id),
        }))

    const entregaEfectiva = project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto

    const initial: ProyectoRegistradoFormInitialData = {
        title: project.title,
        clientName: project.clientName,
        company: project.company || '',
        phone: project.phone,
        email: project.email || '',
        cost: project.cost != null ? String(project.cost) : '',
        advancePayment: project.advancePayment != null ? String(project.advancePayment) : '',
        notes: project.notes || '',
        estimatedDeliveryManual: toDateInputValue(project.estimatedDeliveryManual),
        entregaEfectiva: toDateInputValue(entregaEfectiva),
        clientCanSeeSubpoints: project.clientCanSeeSubpoints,
        clientSignature: project.clientSignature || '',
        receiverSignature: project.receiverSignature || '',
        mainPoints,
    }

    return (
        <ProyectoRegistradoForm
            folio={folio}
            initial={initial}
            userName={session.user?.name}
            userEmail={session.user?.email}
            userRole={session.user?.role}
        />
    )
}
