import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import EliminarProyectoButton from '@/components/admin/EliminarProyectoButton'
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
        borderRadius: '8px',
        padding: '10px 16px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        fontWeight: 700,
    }

    const actionOutlineStyle: React.CSSProperties = {
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: '#ffffff',
        border: '1px solid var(--admin-topbar-border)',
        borderRadius: '8px',
        padding: '10px 16px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        fontWeight: 600,
    }

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={session.user?.name} userEmail={session.user?.email} userRole={session.user?.role} />

            {/* Hero navy: mismo patrón que dashboard/historial/configuración/
                registrar, para que el detalle de un proyecto se sienta parte
                de la misma pantalla en vez de un diseño aparte. */}
            <section style={{ background: 'var(--admin-topbar-bg)', padding: '28px 20px 64px' }}>
                <div className="admin-fade-up" style={{ maxWidth: '1180px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--brand-orange)', margin: '0 0 4px' }}>
                                {project.folio}
                            </p>
                            <h1
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(22px, 4vw, 30px)',
                                    color: '#ffffff',
                                    margin: 0,
                                    wordBreak: 'break-word',
                                }}
                            >
                                {project.title}
                            </h1>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '6px 0 0' }}>
                                {project.clientName}
                                {project.company ? ` · ${project.company}` : ''} · {project.phone}
                                {project.email ? ` · ${project.email}` : ''}
                            </p>
                        </div>

                        <div className="admin-fade-up admin-fade-delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                                <a href={`/api/proyectos/${project.folio}/pdf`} target="_blank" rel="noopener noreferrer" style={actionOutlineStyle}>
                                    Ver PDF
                                </a>
                            )}
                            {project.recordStatus === 'registrado' && session.user?.role === 'admin' && (
                                <a href={`/api/proyectos/${project.folio}/gantt`} style={actionOutlineStyle}>
                                    Descargar diagrama Gantt
                                </a>
                            )}
                            {session.user?.role === 'admin' && (
                                <EliminarProyectoButton folio={project.folio} title={project.title} />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div
                style={{
                    maxWidth: '1180px',
                    margin: '-32px auto 0',
                    padding: '0 20px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                <div
                    className="admin-content-card admin-fade-up admin-fade-delay-1"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                        gap: '16px',
                        padding: '20px 22px',
                    }}
                >
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--admin-text-tertiary)' }}>
                            ESTATUS
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--admin-text-primary)', marginTop: '2px', textTransform: 'capitalize' }}>
                            {project.recordStatus} · {project.status.replace(/_/g, ' ')}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--admin-text-tertiary)' }}>
                            ENTREGA ESTIMADA
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                            {formatDate(entrega)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--admin-text-tertiary)' }}>
                            PAGO
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--admin-text-primary)', marginTop: '2px' }}>
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
                    <div className="admin-content-card admin-fade-up admin-fade-delay-2" style={{ padding: '18px 22px' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>
                            Notas
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-text-primary)', lineHeight: 1.5 }}>
                            {project.notes}
                        </div>
                    </div>
                )}

                <section className="admin-content-card admin-fade-up admin-fade-delay-3" style={{ padding: '20px 22px' }}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                        Fases del proyecto
                    </h2>
                    {project.recordStatus === 'borrador' && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)', margin: '4px 0 0' }}>
                            "Listo para Entrega" y "Entregado" no se muestran todavía: son banderas de estatus que
                            solo aplican una vez registrado el proyecto.
                        </p>
                    )}
                    <div style={{ marginTop: '10px' }}>
                        <PhaseTree
                            nodes={tree.filter(
                                (node) => project.recordStatus !== 'borrador' || !esPuntoSoloEstatus(node.mainPointKey ?? '')
                            )}
                            proyecto={{
                                folio: project.folio,
                                title: project.title,
                                clientName: project.clientName,
                                email: project.email,
                                estimatedDelivery: entrega,
                            }}
                        />
                    </div>
                </section>
            </div>
        </main>
    )
}
