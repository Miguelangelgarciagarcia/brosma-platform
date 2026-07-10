'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/nuevo', label: 'Registrar' },
    { href: '/admin/historial', label: 'Historial' },
    { href: '/admin/configuracion', label: 'Configuración' },
    { href: '/cuenta', label: 'Mi cuenta' },
]

export default function AdminNav() {
    const pathname = usePathname()

    return (
        <nav
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '10px 16px',
                background: 'var(--brand-panel-bg)',
                borderBottom: '1px solid var(--brand-panel-border)',
            }}
        >
            {links.map((link) => {
                const active = pathname === link.href
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            padding: '8px 14px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            color: active ? '#ffffff' : 'var(--brand-panel-fg2)',
                            background: active ? 'var(--brand-orange)' : 'transparent',
                            fontWeight: active ? 700 : 500,
                        }}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </nav>
    )
}
