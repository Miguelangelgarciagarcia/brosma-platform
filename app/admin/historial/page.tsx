import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import HistorialCard from '@/components/admin/HistorialCard'

export default async function HistorialPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const session = await auth()
    if (!session) redirect('/login')

    const { q } = await searchParams
    const query = q?.trim() || ''

    const entregados = await prisma.project.findMany({
        where: {
            status: 'entregado',
            ...(query
                ? {
                      OR: [
                          { folio: { contains: query, mode: 'insensitive' } },
                          { title: { contains: query, mode: 'insensitive' } },
                          { clientName: { contains: query, mode: 'insensitive' } },
                          { company: { contains: query, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        },
        orderBy: { deliveredAt: 'desc' },
        select: {
            folio: true,
            title: true,
            clientName: true,
            company: true,
            deliveredAt: true,
        },
    })

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />

            {/* Hero navy: mismo patrón que el dashboard (app/admin/page.tsx)
                — título arriba, padding extra abajo para que el stat card
                (margin-top negativo, más abajo) se superponga a la frontera
                navy/blanco. */}
            <section
                style={{
                    background: 'var(--admin-topbar-bg)',
                    padding: '28px 20px 64px',
                }}
            >
                <div className="admin-fade-up" style={{ maxWidth: '860px', margin: '0 auto' }}>
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--admin-topbar-fg2)',
                            margin: '0 0 4px',
                        }}
                    >
                        Historial
                    </p>
                    <h1
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(24px, 4vw, 32px)',
                            color: '#ffffff',
                            margin: 0,
                        }}
                    >
                        Proyectos entregados
                    </h1>
                </div>
            </section>

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 32px' }}>
                {/* Stat card superpuesto al límite del hero, igual que en el
                    dashboard. La etiqueta cambia si hay una búsqueda activa,
                    ya que "entregados" ya viene filtrado por el query. */}
                <div style={{ marginTop: '-44px', marginBottom: '28px' }}>
                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '260px' }}>
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
                                fontFamily: 'var(--font-heading)',
                                fontSize: '18px',
                            }}
                        >
                            {entregados.length}
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                {query ? `Resultados para "${query}"` : 'Total entregados'}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                                {entregados.length === 1 ? '1 proyecto' : `${entregados.length} proyectos`}
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    method="GET"
                    className="admin-fade-up admin-fade-delay-1"
                    style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}
                >
                    <input
                        type="text"
                        name="q"
                        defaultValue={query}
                        placeholder="Buscar por folio, cliente, empresa o título..."
                        className="admin-search-input"
                        style={{
                            flex: 1,
                            boxSizing: 'border-box',
                            borderRadius: '10px',
                            padding: '11px 14px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: 'var(--brand-orange)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0 20px',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        Buscar
                    </button>
                </form>

                {entregados.length === 0 ? (
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
                        {query
                            ? 'No se encontraron proyectos entregados que coincidan con tu búsqueda.'
                            : 'Aún no hay proyectos entregados.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {entregados.map((project) => (
                            <HistorialCard key={project.folio} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
