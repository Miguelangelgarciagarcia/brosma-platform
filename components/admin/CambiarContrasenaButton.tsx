'use client'

import { useState } from 'react'
import AccountModal from '@/components/AccountModal'

type CambiarContrasenaButtonProps = {
    userName?: string | null
    userEmail?: string | null
    userRole?: string | null
    className?: string
}

// Botón del hero de Configuración: abre el mismo modal de "Mi cuenta" que
// el avatar del header, en vez de navegar a /cuenta — así no se pierde el
// contexto de la pantalla de Configuración.
export default function CambiarContrasenaButton({ userName, userEmail, userRole, className }: CambiarContrasenaButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={className}
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'var(--brand-orange)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 18px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                }}
            >
                Cambiar mi contraseña →
            </button>

            {open && (
                <AccountModal userName={userName} userEmail={userEmail} userRole={userRole} onClose={() => setOpen(false)} />
            )}
        </>
    )
}
