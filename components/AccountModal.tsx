'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import ChangePasswordForm from '@/components/ChangePasswordForm'

// Mismo ícono de candado usado en app/cuenta/page.tsx (la versión de página
// completa que queda como respaldo si alguien entra directo a /cuenta).
function IconLock() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

function IconClose() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    )
}

type AccountModalProps = {
    userName?: string | null
    userEmail?: string | null
    userRole?: string | null
    onClose: () => void
}

// Modal de "Mi cuenta" (solo cambio de contraseña por ahora): se abre
// flotando sobre la pantalla donde ya está el usuario (Dashboard, Historial,
// Configuración...) en vez de navegar a otra página — así no se pierde el
// contexto de donde se estaba. Vive como componente aparte para poder
// invocarse tanto desde AdminNav (avatar/nombre + entrada del menú móvil)
// como desde el botón "Cambiar mi contraseña" del hero de Configuración.
export default function AccountModal({ userName, userEmail, userRole, onClose }: AccountModalProps) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [onClose])

    const rolLabel = userRole === 'admin' ? 'Administrador' : 'Trabajador'

    // Portal directo a <body>: algunas tarjetas del dashboard (las
    // "atrasadas") tienen una animación infinita (brandBlinkAtrasoLight) que
    // el navegador promueve a su propia capa de composición — eso puede
    // pintarlas por encima de un overlay position:fixed normal aunque su
    // z-index sea menor. Sacar el modal del árbol de esos ancestros con un
    // portal evita el problema de raíz, en vez de subir el z-index a lo loco.
    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(6, 14, 22, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 9999,
                animation: 'brandFadeIn 0.2s ease both',
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Mi cuenta"
                onClick={(e) => e.stopPropagation()}
                className="admin-content-card"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '24px',
                    position: 'relative',
                    animation: 'brandFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="admin-password-toggle"
                    style={{ position: 'absolute', top: '14px', right: '14px' }}
                >
                    <IconClose />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '30px' }}>
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
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                            Cambiar contraseña
                        </h2>
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--admin-text-secondary)',
                                margin: '2px 0 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {userName} · {userEmail} · {rolLabel}
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <ChangePasswordForm />
                </div>
            </div>
        </div>,
        document.body,
    )
}
