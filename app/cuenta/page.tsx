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
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <div
                style={{
                    background: 'var(--brand-navy-deep)',
                    borderBottom: '1px solid var(--brand-panel-border)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-orange)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '0.1em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        GRUPO BROSMA
                    </div>
                </div>
                <Link href={volver} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', textDecoration: 'none' }}>
                    ← Volver
                </Link>
            </div>

            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#ffffff', margin: '0 0 4px' }}>
                        Mi cuenta
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg2)', margin: 0 }}>
                        {session.user?.name} · {session.user?.email} · {session.user?.role}
                    </p>
                </div>

                <ChangePasswordForm />
            </div>
        </main>
    )
}
