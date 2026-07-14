import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import ProjectCard from '@/components/admin/ProjectCard'
import { getYearRange } from '@/lib/dates'
import { calcularProgreso, hayAtraso } from '@/lib/progreso'

// Iconos de línea (sin librería externa) para los stat cards. Puramente
// decorativos, un color distinto por métrica sobre su circulito de fondo.
function IconEnProceso() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    )
}

function IconEntregado() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
        </svg>
    )
}

function IconAtraso() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
    )
}

export default async function AdminPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const { start, end } = getYearRange()
    const currentYear = new Date().getFullYear()

    const [enProcesoCount, entregadosCount, activos] = await Promise.all([
        prisma.project.count({
            where: { status: 'en_proceso', createdAt: { gte: start, lt: end } },
        }),
        prisma.project.count({
            where: { status: 'entregado', deliveredAt: { gte: start, lt: end } },
        }),
        prisma.project.findMany({
            where: { status: 'en_proceso' },
            orderBy: { createdAt: 'desc' },
            select: {
                folio: true,
                title: true,
                clientName: true,
                company: true,
                recordStatus: true,
                estimatedDeliveryManual: true,
                estimatedDeliveryAuto: true,
                phases: {
                    select: { id: true, parentId: true, mainPointKey: true, status: true, startDate: true, endDate: true },
                },
            },
        }),
    ])

    // Progreso y atraso se calculan aquí (con las fases ya traídas) en vez de
    // mandarle el trabajo a cada ProjectCard, para no repetir la consulta.
    const activosConEstado = activos.map((project) => ({
        ...project,
        progreso: calcularProgreso(project.phases),
        atrasado: hayAtraso(project.phases),
    }))

    // Derivado de los datos que ya trajimos arriba (nada de queries nuevas):
    // cuántos de los proyectos activos están atrasados ahora mismo.
    const atrasadosCount = activosConEstado.filter((p) => p.atrasado).length

    const primerNombre = session.user?.name?.trim().split(/\s+/)[0]

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />

            {/* Hero navy: saludo + CTA. El padding-bottom extra deja lugar
                para que los stat cards (margin-top negativo, más abajo) se
                superpongan a la frontera navy/blanco. */}
            <section
                style={{
                    background: 'var(--admin-topbar-bg)',
                    padding: '28px 20px 64px',
                }}
            >
                <div
                    style={{
                        maxWidth: '1000px',
                        margin: '0 auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '16px',
                    }}
                >
                    <div className="admin-fade-up">
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                color: 'var(--admin-topbar-fg2)',
                                margin: '0 0 4px',
                            }}
                        >
                            Hola{primerNombre ? `, ${primerNombre}` : ''}
                        </p>
                        <h1
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(24px, 4vw, 32px)',
                                color: '#ffffff',
                                margin: 0,
                            }}
                        >
                            Panel de administración
                        </h1>
                    </div>

                    <Link
                        href="/admin/nuevo"
                        className="admin-fade-up admin-fade-delay-1"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: 'var(--brand-orange)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '11px 18px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        + Registrar proyecto
                    </Link>
                </div>
            </section>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 32px' }}>
                {/* Stat cards: superpuestos al límite del hero navy gracias
                    al margin-top negativo (mismo truco que un dashboard con
                    header oscuro + cards flotantes en la unión con el
                    contenido claro). */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginTop: '-44px',
                        marginBottom: '32px',
                    }}
                >
                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--admin-icon-orange-bg)',
                                color: 'var(--admin-icon-orange-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconEnProceso />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                En proceso ({currentYear})
                            </p>
                            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, color: 'var(--admin-text-primary)' }}>
                                {enProcesoCount}
                            </p>
                        </div>
                    </div>

                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--admin-icon-navy-bg)',
                                color: 'var(--admin-icon-navy-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconEntregado />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                Entregados ({currentYear})
                            </p>
                            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, color: 'var(--admin-text-primary)' }}>
                                {entregadosCount}
                            </p>
                        </div>
                    </div>

                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--admin-icon-red-bg)',
                                color: 'var(--admin-icon-red-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconAtraso />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                Atrasados ahora
                            </p>
                            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, color: 'var(--admin-text-primary)' }}>
                                {atrasadosCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listado */}
                <div
                    className="admin-fade-up admin-fade-delay-2"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}
                >
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                        Proyectos en proceso
                    </h2>
                </div>

                {activos.length === 0 ? (
                    <div
                        className="admin-content-card admin-fade-up admin-fade-delay-2"
                        style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: 'var(--admin-text-secondary)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                        }}
                    >
                        No hay proyectos en proceso actualmente.
                        <br />
                        Usa &quot;Registrar&quot; en el menú para dar de alta el primero.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activosConEstado.map((project, index) => (
                            <ProjectCard key={project.folio} project={project} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
