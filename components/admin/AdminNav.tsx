'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AccountModal from '@/components/AccountModal'

// Rutas reales de navegación. "Mi cuenta" ya no es una ruta a la que se
// navega — ver accountPillStyle/AccountModal abajo — se abre como modal
// flotante encima de la pantalla donde ya está el usuario, tanto en
// escritorio (clic en avatar/nombre) como en móvil (entrada del menú).
const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/nuevo', label: 'Registrar' },
    { href: '/admin/historial', label: 'Historial' },
    { href: '/admin/mi-trabajo', label: 'Mi trabajo' },
    { href: '/admin/configuracion', label: 'Configuración' },
]

type AdminNavProps = {
    userName?: string | null
    userEmail?: string | null
    userRole?: string | null
    // Server action de signOut, declarada en lib/actions.ts ("use server") y
    // pasada aquí como prop desde AdminHeader — Next.js permite mandar server
    // actions ya definidas a un client component como esta.
    signOutAction: () => Promise<void>
}

// Navegación + bloque de usuario/salir del panel interno. En escritorio: nav
// centrado en la barra (AdminHeader la coloca en grid de 3 columnas) y el
// bloque de usuario a la derecha, donde tocar el avatar/nombre abre "Mi
// cuenta" (modal, sin navegar). En móvil colapsa todo (incluyendo Mi cuenta
// y Salir) dentro de un menú hamburguesa.
export default function AdminNav({ userName, userEmail, userRole, signOutAction }: AdminNavProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [accountOpen, setAccountOpen] = useState(false)
    const [panelTop, setPanelTop] = useState(0)

    // El menú móvil se saca del árbol del header con un portal (ver más
    // abajo): la misma clase de bug que ya vimos en AccountModal — el hero
    // navy + stat cards de abajo, con sus propias animaciones de entrada,
    // pueden terminar en una capa de composición que el navegador pinta por
    // encima del menú desplegable aunque z-index diga lo contrario. Portal a
    // <body> + position:fixed evita el problema de raíz. Como ya no es un
    // hijo posicionado del header (top:100% relativo a él), medimos dónde
    // termina el header para colocarlo justo debajo, y bloqueamos el scroll
    // mientras está abierto para que esa medición no se desactualice.
    useEffect(() => {
        if (!open) return
        const header = document.getElementById('admin-header-bar')
        if (header) setPanelTop(header.getBoundingClientRect().bottom)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [open])

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
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="admin-nav-pill" style={pillStyle(pathname === link.href)}>
                        {link.label}
                    </Link>
                ))}
            </nav>

            {/* Escritorio: usuario + salir, a la derecha. El avatar/nombre
                abre "Mi cuenta" como modal (ya no navega a otra página).
                Oculto en móvil. */}
            <div className="admin-topbar-user">
                {userName && (
                    <button
                        type="button"
                        onClick={() => setAccountOpen(true)}
                        className="admin-account-link"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            minWidth: 0,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <Avatar />
                        <NameRole />
                    </button>
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

            {/* Panel desplegable móvil: nav completo + usuario/salir apilados.
                El avatar/nombre es el único punto de entrada a "Mi cuenta"
                (igual que en escritorio) — nada de repetir un pill aparte.
                Portal a <body> (ver comentario junto al useEffect de arriba)
                con position:fixed anclado justo debajo del header medido. */}
            {open && createPortal(
                <div className="admin-mobile-panel" style={{ position: 'fixed', top: panelTop, left: 0, right: 0, zIndex: 9999 }}>
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
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false)
                                    setAccountOpen(true)
                                }}
                                className="admin-account-link"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    minWidth: 0,
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <Avatar />
                                <NameRole />
                            </button>
                        )}
                        <SalirButton full />
                    </div>
                </div>,
                document.body,
            )}

            {accountOpen && (
                <AccountModal
                    userName={userName}
                    userEmail={userEmail}
                    userRole={userRole}
                    onClose={() => setAccountOpen(false)}
                />
            )}
        </>
    )
}
