import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/dates'
import { labelDePunto } from '@/lib/main-points'

type PhaseWithResp = {
    id: string
    parentId: string | null
    depth: number
    order: number
    title: string
    description: string | null
    status: string
    estimatedDays: number | null
    startDate: Date | null
    endDate: Date | null
    responsible: { name: string }
}

function buildTree(phases: PhaseWithResp[]) {
    const byParent = new Map<string | null, PhaseWithResp[]>()
    for (const p of phases) {
        const list = byParent.get(p.parentId) || []
        list.push(p)
        byParent.set(p.parentId, list)
    }
    for (const list of byParent.values()) list.sort((a, b) => a.order - b.order)

    function children(parentId: string | null): (PhaseWithResp & { children: any[] })[] {
        return (byParent.get(parentId) || []).map((p) => ({ ...p, children: children(p.id) }))
    }

    return children(null)
}

function PhaseNode({ node, label }: { node: any; label: string }) {
    return (
        <div style={{ marginLeft: node.depth > 0 ? '16px' : 0, marginTop: '8px' }}>
            <div
                style={{
                    border: '1px solid var(--border-subtle)',
                    borderLeft: node.depth === 0 ? '3px solid var(--accent)' : '2px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    background: node.depth === 0 ? 'var(--bg-card)' : 'transparent',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: node.depth === 0 ? '13px' : '12px', fontWeight: node.depth === 0 ? 600 : 400 }}>
                        {label}. {node.title}
                    </span>
                    <span
                        style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background:
                                node.status === 'completado'
                                    ? 'rgba(47,111,237,0.15)'
                                    : node.status === 'en_proceso'
                                    ? 'rgba(224,160,32,0.15)'
                                    : 'rgba(255,255,255,0.06)',
                            color:
                                node.status === 'completado'
                                    ? 'var(--accent-hover)'
                                    : node.status === 'en_proceso'
                                    ? '#e0a020'
                                    : 'var(--fg3)',
                            height: 'fit-content',
                        }}
                    >
                        {node.status}
                    </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--fg3)', marginTop: '4px' }}>
                    Responsable: {node.responsible?.name}
                    {node.estimatedDays != null && ` · ${node.estimatedDays} días estimados`}
                </div>
                {node.description && (
                    <div style={{ fontSize: '12px', color: 'var(--fg2)', marginTop: '6px' }}>{node.description}</div>
                )}
            </div>
            {node.children.map((child: any, i: number) => (
                <PhaseNode key={child.id} node={child} label={`${label}.${i + 1}`} />
            ))}
        </div>
    )
}

export default async function ProyectoDetallePage({
    params,
}: {
    params: Promise<{ folio: string }>
}) {
    const session = await auth()
    if (!session) redirect('/login')

    const { folio } = await params

    const project = await prisma.project.findUnique({
        where: { folio },
        include: {
            phases: { include: { responsible: { select: { name: true } } } },
        },
    })

    if (!project) notFound()

    const tree = buildTree(project.phases as any)
    const entrega = project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto

    return (
        <main style={{ minHeight: '100vh' }}>
            <div
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '16px' }}>Brosma</div>
                <Link href="/admin" style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                    ← Volver
                </Link>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent-hover)' }}>{project.folio}</div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{project.title}</h1>
                    <div style={{ fontSize: '13px', color: 'var(--fg2)' }}>
                        {project.clientName}
                        {project.company ? ` · ${project.company}` : ''} · {project.phone}
                        {project.email ? ` · ${project.email}` : ''}
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--fg3)' }}>ESTATUS</div>
                        <div style={{ fontSize: '13px' }}>
                            {project.recordStatus} · {project.status}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--fg3)' }}>ENTREGA ESTIMADA</div>
                        <div style={{ fontSize: '13px' }}>{formatDate(entrega)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--fg3)' }}>PAGO</div>
                        <div style={{ fontSize: '13px' }}>
                            {project.paymentStatus} {project.cost ? `· $${project.cost}` : ''}
                        </div>
                    </div>
                </div>

                {project.notes && (
                    <div style={{ fontSize: '13px', color: 'var(--fg2)' }}>
                        <strong style={{ color: 'var(--fg1)' }}>Notas: </strong>
                        {project.notes}
                    </div>
                )}

                <div>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '4px' }}>
                        Fases del proyecto
                    </h2>
                    {tree.map((node, i) => (
                        <PhaseNode key={node.id} node={node} label={`${i + 1}`} />
                    ))}
                </div>
            </div>
        </main>
    )
}
