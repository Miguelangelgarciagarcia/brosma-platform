import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'
import ProjectCard from '@/components/admin/ProjectCard'
import { getYearRange } from '@/lib/dates'

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
            },
        }),
    ])

    return (
        <main style={{ minHeight: '100vh' }}>
            {/* Header */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fg2)' }}>
                        {session.user?.name} · {session.user?.role}
                    </span>
                    <form
                        action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/login' })
                        }}
                    >
                        <button
                            type="submit"
                            style={{
                                fontSize: '12px',
                                color: 'var(--fg2)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Salir
                        </button>
                    </form>
                </div>
            </div>

            <AdminNav />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-default)',
                            borderTop: '2px solid var(--accent)',
                            borderRadius: 'var(--radius-md)',
                            padding: '18px',
                        }}
                    >
                        <p style={{ fontSize: '11px', color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                            En proceso ({currentYear})
                        </p>
                        <p style={{ fontSize: '36px', fontWeight: 700, margin: 0, color: 'var(--accent-hover)' }}>{enProcesoCount}</p>
                    </div>
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-default)',
                            borderTop: '2px solid var(--accent)',
                            borderRadius: 'var(--radius-md)',
                            padding: '18px',
                        }}
                    >
                        <p style={{ fontSize: '11px', color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                            Entregados ({currentYear})
                        </p>
                        <p style={{ fontSize: '36px', fontWeight: 700, margin: 0, color: 'var(--accent-hover)' }}>{entregadosCount}</p>
                    </div>
                </div>

                {/* Listado */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Proyectos en proceso</h2>
                </div>

                {activos.length === 0 ? (
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            padding: '40px',
                            textAlign: 'center',
                            color: 'var(--fg3)',
                            fontSize: '13px',
                        }}
                    >
                        No hay proyectos en proceso actualmente.
                        <br />
                        Usa &quot;Registrar&quot; en el menú para dar de alta el primero.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activos.map((project) => (
                            <ProjectCard key={project.folio} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
