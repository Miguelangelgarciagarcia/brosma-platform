import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
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
                            style={{ fontSize: '12px', color: 'var(--fg2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Salir
                        </button>
                    </form>
                </div>
            </div>

            <AdminNav />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Historial de entregados</h1>

                <form method="GET" style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        name="q"
                        defaultValue={query}
                        placeholder="Buscar por folio, cliente, empresa o título..."
                        style={{
                            flex: 1,
                            boxSizing: 'border-box',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            color: 'var(--fg1)',
                            fontSize: '14px',
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0 18px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Buscar
                    </button>
                </form>

                {entregados.length === 0 ? (
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
