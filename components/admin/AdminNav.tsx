'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

// Links completos: se usan en el panel móvil (incluye "Mi cuenta" como
// entrada normal de la lista). En escritorio "Mi cuenta" no se repite como
// pill aparte — ver deskLinks abajo — porque ese destino ya se abre al
// tocar el bloque de usuario (avatar + nombre/rol).
const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/nuevo', label: 'Registrar' },
    { href: '/admin/historial', label: 'Historial' },
    { href: '/admin/configuracion', label: 'Configuración' },
    { href: '/cuenta', label: 'Mi cuenta' },
]

const deskLinks = links.filter((link) => link.href !== '/cuenta')

type AdminNavProps = {
    userName?: string | null
    userRole?: string | null
    // Server action de signOut, definida en AdminHeader (server component) y
    // pasada aquí como prop — Next.js permite mandar server actions a un
    // client component como esta.
    signOutAction: () => Promise<void>
}

// Navegación + bloque de usuario/salir del panel interno. En escritorio: nav
// centrado en la barra (AdminHeader la coloca en grid de 3 columnas) y el
// bloque de usuario a la derecha, donde tocar el avatar/nombre abre "Mi
// cuenta". En móvil colapsa todo (incluyendo Mi cuenta y Salir) dentro de un
// menú hamburguesa.
export default function AdminNav({ userName, userRole, signOutAction }: AdminNavProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const iniciales = (userName || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')

    const pillStyle = (active: boolean): React.CSSProperties => ({
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        padding: '8px 14px',
        borderRadius: '999px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        color: active ? 'var(--admin-topbar-bg)' : 'var(--admin-topbar-fg2)',
        background: active ? '#ffffff' : 'transparent',
        fontWeight: active ? 700 : 500,
    })

    const Avatar = () => (
        <div
            style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--admin-topbar-bg-elev)',
                border: '1px solid var(--admin-topbar-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--admin-topbar-fg)',
                flexShrink: 0,
            }}
        >
            {iniciales}
        </div>
    )

    const NameRole = () => (
        <div style={{ minWidth: 0, lineHeight: 1.25 }}>
            <div
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--admin-topbar-fg)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '160px',
                }}
            >
                {userName}
            </div>
            {userRole && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-topbar-fg2)', textTransform: 'capitalize' }}>
                    {userRole}
                </div>
            )}
        </div>
    )

    const SalirButton = ({ full }: { full?: boolean }) => (
        <form action={signOutAction} style={full ? { width: '100%' } : undefined}>
            <button
                type="submit"
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--admin-topbar-fg2)',
                    background: 'none',
                    border: '1px solid var(--admin-topbar-border)',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    cursor: 'pointer',
                    width: full ? '100%' : undefined,
                    textAlign: full ? 'left' : undefined,
                }}
            >
                Salir
            </button>
        </form>
    )

    return (
        <>
            {/* Escritorio: nav centrado (AdminHeader lo ubica vía CSS grid,
                ver .admin-topbar-nav en globals.css). Oculto en móvil. */}
            <nav className="admin-topbar-nav">
                {deskLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="admin-nav-pill" style={pillStyle(pathname === link.href)}>
                        {link.label}
                    </Link>
                ))}
            </nav>

            {/* Escritorio: usuario + salir, a la derecha. El avatar/nombre
                es un link a "Mi cuenta" (ya no hay pill aparte para eso).
                Oculto en móvil. */}
            <div className="admin-topbar-user">
                {userName && (
                    <Link
                        href="/cuenta"
                        className="admin-account-link"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, textDecoration: 'none' }}
                    >
                        <Avatar />
                        <NameRole />
                    </Link>
                )}
                <SalirButton />
            </div>

            {/* Móvil: botón hamburguesa. Oculto en escritorio vía CSS. */}
            <button
                type="button"
                className="admin-hamburger-btn"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={open}
                style={{
                    background: 'none',
                    border: '1px solid var(--admin-topbar-border)',
                    borderRadius: '8px',
                    width: '38px',
                    height: '38px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
            >
                {open ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                )}
            </button>

            {/* Panel desplegable móvil: nav completo (incluye Mi cuenta) +
                usuario + salir apilados. */}
            {open && (
                <div className="admin-mobile-panel">
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '14px' }}>
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="admin-nav-pill"
                                onClick={() => setOpen(false)}
                                style={{ ...pillStyle(pathname === link.href), borderRadius: '8px', padding: '10px 12px' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div
                        style={{
                            borderTop: '1px solid var(--admin-topbar-border)',
                            paddingTop: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {userName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <Avatar />
                                <NameRole />
                            </div>
                        )}
                        <SalirButton full />
                    </div>
                </div>
            )}
        </>
    )
}
