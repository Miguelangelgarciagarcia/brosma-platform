import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Placeholder de verificación para la Fase 0.
// El dashboard real (contadores, listado) se construye en la Fase 2.
export default async function AdminPage() {
    const session = await auth()
    if (!session) redirect('/login')

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Panel Admin (placeholder)</h1>
            <p style={{ color: 'var(--fg2)' }}>
                Sesión iniciada como <strong>{session.user?.email}</strong> (rol: {session.user?.role})
            </p>
            <p style={{ color: 'var(--fg3)', fontSize: '13px' }}>
                El dashboard real llega en la Fase 2.
            </p>
            <form action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
            }}>
                <button type="submit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--fg1)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    Cerrar sesión
                </button>
            </form>
        </main>
    )
}
