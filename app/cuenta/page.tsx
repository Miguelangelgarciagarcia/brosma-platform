import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChangePasswordForm from '@/components/ChangePasswordForm'

// Icono de candado: mismo lenguaje de línea que los íconos de módulo del
// dashboard/configuración (sin librería externa, un solo color de acento).
function IconLock() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

// Página compartida (Admin y Trabajador) para gestionar la cuenta propia.
// No cuelga de /admin ni /trabajo para no chocar con las restricciones de
// rol de esas dos secciones — por eso trae su propio encabezado simple
// (logo + volver) en vez de <AdminHeader/>, que solo tiene sentido para Admin.
export default async function CuentaPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const volver = session.user?.role === 'admin' ? '/admin' : '/trabajo'
    const rolLabel = session.user?.role === 'admin' ? 'Administrador' : 'Trabajador'

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <div
                style={{
                    background: 'var(--admin-topbar-bg)',
                    borderBottom: '1px solid var(--admin-topbar-border)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'brandFadeIn 0.6s ease both',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-orange)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '0.1em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        GRUPO BROSMA
                    </div>
                </div>
                <Link href={volver} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--brand-orange)', textDecoration: 'none' }}>
                    ← Volver
                </Link>
            </div>

            {/* Hero navy: mismo patrón que dashboard/historial/configuración. */}
            <section style={{ background: 'var(--admin-topbar-bg)', padding: '28px 20px 64px' }}>
                <div className="admin-fade-up" style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '0 0 4px' }}>
                        Mi cuenta
                    </p>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 32px)', color: '#ffffff', margin: 0 }}>
                        Seguridad de tu cuenta
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '8px 0 0' }}>
                        {session.user?.name} · {session.user?.email} · {rolLabel}
                    </p>
                </div>
            </section>

            {/* Card flotante superpuesto sobre el hero, igual patrón que las
                tarjetas de estadísticas del dashboard/historial/configuración. */}
            <div style={{ maxWidth: '520px', margin: '-44px auto 40px', padding: '0 20px' }}>
                <section className="admin-content-card admin-fade-up admin-fade-delay-1" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--admin-icon-orange-bg)',
                                color: 'var(--admin-icon-orange-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconLock />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                                Cambiar contraseña
                            </h2>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '2px 0 0' }}>
                                Usa una contraseña que no compartas en otros sitios
                            </p>
                        </div>
                    </div>

                    <ChangePasswordForm />
                </section>
            </div>
        </main>
    )
}
