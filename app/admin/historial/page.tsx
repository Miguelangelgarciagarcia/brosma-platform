import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNav from '@/components/admin/AdminNav'
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
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />
            <AdminNav />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg)' }}>
                    Historial de entregados
                </h1>

                <form method="GET" style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        name="q"
                        defaultValue={query}
                        placeholder="Buscar por folio, cliente, empresa o título..."
                        style={{
                            flex: 1,
                            boxSizing: 'border-box',
                            background: 'var(--brand-panel-card)',
                            border: '1px solid var(--brand-panel-border)',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            color: 'var(--brand-panel-fg)',
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
                            borderRadius: '6px',
                            padding: '0 18px',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Buscar
                    </button>
                </form>

                {entregados.length === 0 ? (
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
                        {query
                            ? 'No se encontraron proyectos entregados que coincidan con tu búsqueda.'
                            : 'Aún no hay proyectos entregados.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entregados.map((project) => (
                            <HistorialCard key={project.folio} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
