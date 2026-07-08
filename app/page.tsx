import Link from 'next/link'

// Home "gateway": solo dos opciones, sin landing de marketing (esa vive en Wix).
// Se reemplazará visualmente más adelante; por ahora es intencionalmente simple.
export default function Home() {
    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '24px',
                textAlign: 'center',
            }}
        >
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Brosma</h1>
                <p style={{ color: 'var(--fg2)', marginTop: '8px' }}>
                    Plataforma de gestión y seguimiento de proyectos
                </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/login"
                    style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Iniciar sesión
                </Link>
                <Link
                    href="/seguimiento"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--fg1)',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Rastrear proyecto
                </Link>
            </div>
        </main>
    )
}
