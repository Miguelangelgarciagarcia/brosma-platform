'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Botón pequeño junto a una cuenta pendiente de verificar en Configuración
// → Usuarios. Reenvía el correo de verificación (nuevo token, el anterior
// sigue vigente hasta que expire por su cuenta).
export default function ReenviarVerificacionButton({ userId }: { userId: string }) {
    const router = useRouter()
    const [estado, setEstado] = useState<'idle' | 'cargando' | 'enviado' | 'error'>('idle')

    async function reenviar() {
        setEstado('cargando')
        try {
            const res = await fetch(`/api/usuarios/${userId}/reenviar-verificacion`, { method: 'POST' })
            if (!res.ok) throw new Error()
            setEstado('enviado')
            router.refresh()
        } catch {
            setEstado('error')
        }
    }

    if (estado === 'enviado') {
        return (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--admin-success-fg)' }}>
                Correo reenviado
            </span>
        )
    }

    return (
        <button
            type="button"
            onClick={reenviar}
            disabled={estado === 'cargando'}
            style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--brand-orange)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                opacity: estado === 'cargando' ? 0.6 : 1,
            }}
        >
            {estado === 'cargando' ? 'Enviando...' : estado === 'error' ? 'Error, reintentar' : 'Reenviar verificación'}
        </button>
    )
}
