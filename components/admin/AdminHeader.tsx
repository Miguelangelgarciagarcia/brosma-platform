import { signOut } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

type AdminHeaderProps = {
    userName?: string | null
    userRole?: string | null
}

// Header compartido de todo el panel interno (Admin/Trabajador): una sola
// barra navy con el logo a la izquierda y, junto a él, la navegación +
// usuario + salir (AdminNav, client component: necesita usePathname para
// resaltar el link activo y useState para el menú hamburguesa en móvil).
export default function AdminHeader({ userName, userRole }: AdminHeaderProps) {
    return (
        <header
            className="admin-header-bar"
            style={{
                position: 'relative',
                background: 'var(--admin-topbar-bg)',
                padding: '14px 20px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
                        color: 'var(--admin-topbar-fg)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    GRUPO BROSMA
                </div>
            </div>

            <AdminNav
                userName={userName}
                userRole={userRole}
                signOutAction={async () => {
                    'use server'
                    await signOut({ redirectTo: '/login' })
                }}
            />
        </header>
    )
}
