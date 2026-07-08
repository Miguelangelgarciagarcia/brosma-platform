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
                gap: '4px',
                padding: '10px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                overflowX: 'auto',
            }}
        >
            {links.map((link) => {
                const active = pathname === link.href
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        style={{
                            fontSize: '13px',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            color: active ? '#fff' : 'var(--fg2)',
                            background: active ? 'var(--accent)' : 'transparent',
                            fontWeight: active ? 600 : 400,
                        }}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </nav>
    )
}
