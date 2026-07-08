'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarcarEstatusButton({ phaseId }: { phaseId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function marcar() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/fases/${phaseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completado' }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al actualizar')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ marginTop: '6px' }}>
            <button
                type="button"
                disabled={loading}
                onClick={marcar}
                style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                {loading ? 'Guardando...' : 'Marcar como completado'}
            </button>
            {error && <p style={{ color: '#ff6b6b', fontSize: '11px', margin: '4px 0 0' }}>{error}</p>}
        </div>
    )
}
