import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNav from '@/components/admin/AdminNav'
import ProjectCard from '@/components/admin/ProjectCard'
import { getYearRange } from '@/lib/dates'
import { calcularProgreso, hayAtraso } from '@/lib/progreso'

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

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />
            <AdminNav />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                    <div
                        style={{
                            background: 'var(--brand-panel-card)',
                            border: '1px solid var(--brand-panel-border)',
                            borderTop: '2px solid var(--brand-orange)',
                            borderRadius: '10px',
                            padding: '18px',
                        }}
                    >
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '11px',
                                color: 'var(--brand-panel-fg2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                margin: '0 0 8px',
                            }}
                        >
                            En proceso ({currentYear})
                        </p>
                        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', margin: 0, color: '#ffffff' }}>
                            {enProcesoCount}
                        </p>
                    </div>
                    <div
                        style={{
                            background: 'var(--brand-panel-card)',
                            border: '1px solid var(--brand-panel-border)',
                            borderTop: '2px solid var(--brand-orange)',
                            borderRadius: '10px',
                            padding: '18px',
                        }}
                    >
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '11px',
                                color: 'var(--brand-panel-fg2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                margin: '0 0 8px',
                            }}
                        >
                            Entregados ({currentYear})
                        </p>
                        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', margin: 0, color: '#ffffff' }}>
                            {entregadosCount}
                        </p>
                    </div>
                </div>

                {/* Listado */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg)' }}>
                        Proyectos en proceso
                    </h2>
                </div>

                {activos.length === 0 ? (
                    <div
                        style={{
                            background: 'var(--brand-panel-card)',
                            border: '1px solid var(--brand-panel-border)',
                            borderRadius: '10px',
                            padding: '40px',
                            textAlign: 'center',
                            color: 'var(--brand-panel-fg3)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                        }}
                    >
                        No hay proyectos en proceso actualmente.
                        <br />
                        Usa &quot;Registrar&quot; en el menú para dar de alta el primero.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activosConEstado.map((project) => (
                            <ProjectCard key={project.folio} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
