import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/dates'
import { esPuntoSoloEstatus } from '@/lib/main-points'
import PhaseTree from '@/components/admin/PhaseTree'

type PhaseWithResp = {
    id: string
    parentId: string | null
    depth: number
    order: number
    mainPointKey: string | null
    title: string
    description: string | null
    status: string
    estimatedDays: number | null
    startDate: Date | null
    endDate: Date | null
    responsible: { name: string }
}

function formatMonto(n: number): string {
    return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent-hover)' }}>{project.folio}</div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{project.title}</h1>
                        <div style={{ fontSize: '13px', color: 'var(--fg2)' }}>
                            {project.clientName}
                            {project.company ? ` · ${project.company}` : ''} · {project.phone}
                            {project.email ? ` · ${project.email}` : ''}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {project.recordStatus === 'borrador' && (
                            <Link
                                href={`/admin/proyecto/${project.folio}/editar`}
                                style={{
                                    fontSize: '12px',
                                    color: '#fff',
                                    background: 'var(--accent)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '8px 14px',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 600,
                                }}
                            >
                                Editar
                            </Link>
                        )}
                        {project.recordStatus === 'registrado' && session.user?.role === 'admin' && (
                            <Link
                                href={`/admin/proyecto/${project.folio}/editar-registrado`}
                                style={{
                                    fontSize: '12px',
                                    color: '#fff',
                                    background: 'var(--accent)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '8px 14px',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 600,
                                }}
                            >
                                Editar
                            </Link>
                        )}
                        {project.recordStatus === 'registrado' && (
                            <a
                                href={`/api/proyectos/${project.folio}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '12px',
                                    color: 'var(--accent-hover)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '8px 14px',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Ver PDF
                            </a>
                        )}
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
                            {project.paymentStatus === 'pagado' && (
                                <>
                                    <strong style={{ color: 'var(--accent-hover)' }}>PAGADO</strong>
                                    {project.cost != null && ` · $${formatMonto(project.cost)}`}
                                </>
                            )}
                            {project.paymentStatus === 'anticipo' && (
                                <>
                                    Faltan ${formatMonto((project.cost ?? 0) - (project.advancePayment ?? 0))}
                                    {' '}de ${formatMonto(project.cost ?? 0)}
                                </>
                            )}
                            {project.paymentStatus === 'pendiente' && 'Pendiente'}
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
                    {project.recordStatus === 'borrador' && (
                        <p style={{ fontSize: '11px', color: 'var(--fg3)', margin: '0 0 8px' }}>
                            "Listo para Entrega" y "Entregado" no se muestran todavía: son banderas de estatus que
                            solo aplican una vez registrado el proyecto.
                        </p>
                    )}
                    <PhaseTree
                        nodes={tree.filter(
                            (node) => project.recordStatus !== 'borrador' || !esPuntoSoloEstatus(node.mainPointKey ?? '')
                        )}
                        proyecto={{
                            folio: project.folio,
                            title: project.title,
                            clientName: project.clientName,
                            email: project.email,
                        }}
                    />
                </div>
            </div>
        </main>
    )
}
