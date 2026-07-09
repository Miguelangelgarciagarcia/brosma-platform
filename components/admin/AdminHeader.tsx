import { signOut } from '@/lib/auth'

type AdminHeaderProps = {
    userName?: string | null
    userRole?: string | null
}

// Header compartido de todo el panel interno (Admin/Trabajador): antes vivía
// duplicado en cada página (dashboard, historial, configuración...) con
// estilos genéricos. Ahora es un solo componente con la identidad de Grupo
// Brosma (navy + acento naranja + Grifter/DM Sans), para que el panel se
// sienta parte de la misma aplicación que el inicio/seguimiento/login.
export default function AdminHeader({ userName, userRole }: AdminHeaderProps) {
    return (
        <div
            style={{
                background: 'var(--brand-navy-deep)',
                borderBottom: '1px solid var(--brand-panel-border)',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        background: 'var(--brand-orange)',
                        transform: 'rotate(45deg)',
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '15px',
                        letterSpacing: '0.1em',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                    }}
                >
                    GRUPO BROSMA
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {userName && (
                    <span
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--brand-white-65)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {userName} · {userRole}
                    </span>
                )}
                <form
                    action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}
                >
                    <button
                        type="submit"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--brand-white-65)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Salir
                    </button>
                </form>
            </div>
        </div>
    )
}
