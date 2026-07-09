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

    const actionLinkStyle: React.CSSProperties = {
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: '#ffffff',
        background: 'var(--brand-orange)',
        borderRadius: '6px',
        padding: '8px 14px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        fontWeight: 700,
    }

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <div
                style={{
                    background: 'var(--brand-navy-deep)',
                    borderBottom: '1px solid var(--brand-panel-border)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-orange)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '0.1em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        GRUPO BROSMA
                    </div>
                </div>
                <Link href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', textDecoration: 'none' }}>
                    ← Volver
                </Link>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--brand-orange)' }}>{project.folio}</div>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: '#ffffff', margin: '4px 0' }}>
                            {project.title}
                        </h1>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg2)' }}>
                            {project.clientName}
                            {project.company ? ` · ${project.company}` : ''} · {project.phone}
                            {project.email ? ` · ${project.email}` : ''}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {project.recordStatus === 'borrador' && (
                            <Link href={`/admin/proyecto/${project.folio}/editar`} style={actionLinkStyle}>
                                Editar
                            </Link>
                        )}
                        {project.recordStatus === 'registrado' && session.user?.role === 'admin' && (
                            <Link href={`/admin/proyecto/${project.folio}/editar-registrado`} style={actionLinkStyle}>
                                Editar
                            </Link>
                        )}
                        {project.recordStatus === 'registrado' && (
                            <a
                                href={`/api/proyectos/${project.folio}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    color: 'var(--brand-panel-fg)',
                                    border: '1px solid var(--brand-panel-border)',
                                    borderRadius: '6px',
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
                        background: 'var(--brand-panel-card)',
                        border: '1px solid var(--brand-panel-border)',
                        borderRadius: '10px',
                        padding: '14px',
                    }}
                >
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--brand-panel-fg3)' }}>ESTATUS</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg)' }}>
                            {project.recordStatus} · {project.status}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--brand-panel-fg3)' }}>ENTREGA ESTIMADA</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg)' }}>{formatDate(entrega)}</div>
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--brand-panel-fg3)' }}>PAGO</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg)' }}>
                            {project.paymentStatus === 'pagado' && (
                                <>
                                    <strong style={{ color: 'var(--brand-orange)' }}>PAGADO</strong>
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
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg2)' }}>
                        <strong style={{ color: 'var(--brand-panel-fg)' }}>Notas: </strong>
                        {project.notes}
                    </div>
                )}

                <div>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg2)', marginBottom: '4px' }}>
                        Fases del proyecto
                    </h2>
                    {project.recordStatus === 'borrador' && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', margin: '0 0 8px' }}>
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
