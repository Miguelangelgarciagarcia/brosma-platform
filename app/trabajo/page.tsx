import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FaseCard from '@/components/trabajo/FaseCard'

export default async function TrabajoPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const fases = await prisma.phase.findMany({
        where: { responsibleId: session.user.id },
        include: {
            project: { select: { folio: true, title: true, clientName: true } },
            parent: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    const pendientes = fases.filter((f) => f.status !== 'completado')
    const completados = fases.filter((f) => f.status === 'completado')

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
                    <span style={{ fontSize: '12px', color: 'var(--fg2)' }}>{session.user?.name}</span>
                    <Link href="/cuenta" style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                        Mi cuenta
                    </Link>
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

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Mis puntos asignados</h1>

                <div>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '10px' }}>
                        Pendientes ({pendientes.length})
                    </h2>
                    {pendientes.length === 0 ? (
                        <div
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                padding: '24px',
                                textAlign: 'center',
                                color: 'var(--fg3)',
                                fontSize: '13px',
                            }}
                        >
                            No tienes puntos pendientes por ahora.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {pendientes.map((fase) => (
                                <FaseCard key={fase.id} fase={fase as any} />
                            ))}
                        </div>
                    )}
                </div>

                {completados.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '10px' }}>
                            Terminados ({completados.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {completados.map((fase) => (
                                <FaseCard key={fase.id} fase={fase as any} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
