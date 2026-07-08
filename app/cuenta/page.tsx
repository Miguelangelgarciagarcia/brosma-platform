import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChangePasswordForm from '@/components/ChangePasswordForm'

// Página compartida (Admin y Trabajador) para gestionar la cuenta propia.
// No cuelga de /admin ni /trabajo para no chocar con las restricciones de
// rol de esas dos secciones.
export default async function CuentaPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const volver = session.user?.role === 'admin' ? '/admin' : '/trabajo'

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
                <Link href={volver} style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                    ← Volver
                </Link>
            </div>

            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>Mi cuenta</h1>
                    <p style={{ fontSize: '13px', color: 'var(--fg2)', margin: 0 }}>
                        {session.user?.name} · {session.user?.email} · {session.user?.role}
                    </p>
                </div>

                <ChangePasswordForm />
            </div>
        </main>
    )
}
