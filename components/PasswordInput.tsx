'use client'

import { useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// Input de contraseña reutilizable con botón de mostrar/ocultar (ojito).
// Se usa en login, cambio de contraseña, etc. — cualquier campo donde el
// usuario deba poder verificar lo que escribió antes de enviarlo.
export default function PasswordInput({ style, ...props }: PasswordInputProps) {
    const [visible, setVisible] = useState(false)

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input
                type={visible ? 'text' : 'password'}
                {...props}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 40px 10px 12px',
                    color: 'var(--fg1)',
                    fontSize: '14px',
                    ...style,
                }}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
                style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--fg3)',
                }}
            >
                {visible ? (
                    // Ojo tachado (ocultar)
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                ) : (
                    // Ojo abierto (mostrar)
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    )
}
