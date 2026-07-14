'use client'

import { useState } from 'react'
import AccountModal from '@/components/AccountModal'

type Props = {
    userName?: string | null
    userEmail?: string | null
    userRole?: string | null
    // Server action de signOut, declarada en lib/actions.ts ("use server").
    signOutAction: () => Promise<void>
}

// Header ligero del panel de Trabajo: misma línea visual que AdminHeader
// (barra navy, logo, avatar/nombre que abre "Mi cuenta" como modal) pero
// sin la navegación de Admin (Dashboard/Registrar/Historial/Configuración),
// que no aplica aquí. No necesita menú hamburguesa: al no haber nav que
// colapsar, el bloque de usuario se queda visible siempre, envolviendo en
// una segunda línea en pantallas muy angostas si hace falta.
export default function WorkerHeader({ userName, userEmail, userRole, signOutAction }: Props) {
    const [accountOpen, setAccountOpen] = useState(false)

    const iniciales = (userName || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')

    return (
        <header
            className="admin-fade-up"
            style={{
                background: 'var(--admin-topbar-bg)',
                padding: '14px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
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
                                <div
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '11px',
                                        color: 'var(--admin-topbar-fg2)',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {userRole}
                                </div>
                            )}
                        </div>
                    </button>
                )}

                <form action={signOutAction}>
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
                        }}
                    >
                        Salir
                    </button>
                </form>
            </div>

            {accountOpen && (
                <AccountModal userName={userName} userEmail={userEmail} userRole={userRole} onClose={() => setAccountOpen(false)} />
            )}
        </header>
    )
}
