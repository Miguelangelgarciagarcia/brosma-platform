import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import UserForm from '@/components/admin/UserForm'
import { formatDate } from '@/lib/dates'

export default async function ConfiguracionPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    const usuarios = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
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

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Configuración</h1>
                    <Link href="/cuenta" style={{ fontSize: '12px', color: 'var(--accent-hover)', textDecoration: 'none' }}>
                        Cambiar mi contraseña →
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>
                    <UserForm />

                    <div>
                        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '10px' }}>
                            Cuentas existentes ({usuarios.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {usuarios.map((u) => (
                                <div
                                    key={u.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px 14px',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{u.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--fg2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {u.email}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                background: u.role === 'admin' ? 'rgba(47,111,237,0.15)' : 'rgba(255,255,255,0.06)',
                                                color: u.role === 'admin' ? 'var(--accent-hover)' : 'var(--fg3)',
                                            }}
                                        >
                                            {u.role}
                                        </span>
                                        <div style={{ fontSize: '10px', color: 'var(--fg3)', marginTop: '4px' }}>
                                            desde {formatDate(u.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
