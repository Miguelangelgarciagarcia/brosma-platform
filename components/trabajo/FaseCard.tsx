'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    fase: {
        id: string
        title: string
        description: string | null
        status: string
        startDate: Date | string | null
        endDate: Date | string | null
        project: { folio: string; title: string; clientName: string }
        parent: { title: string } | null
    }
}

function formatDate(d: Date | string | null) {
    if (!d) return null
    const date = typeof d === 'string' ? new Date(d) : d
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date)
}

export default function FaseCard({ fase }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function actualizar(status: string) {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/fases/${fase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
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

    const rango = [formatDate(fase.startDate), formatDate(fase.endDate)].filter(Boolean).join(' → ')

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderLeft: `3px solid ${fase.status === 'completado' ? 'var(--accent)' : fase.status === 'en_proceso' ? '#e0a020' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}
        >
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--fg3)' }}>
                {fase.project.folio} · {fase.project.title}
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600 }}>
                {fase.parent ? `${fase.parent.title} → ` : ''}
                {fase.title}
            </div>

            {fase.description && (
                <div style={{ fontSize: '12px', color: 'var(--fg2)' }}>{fase.description}</div>
            )}

            {rango && <div style={{ fontSize: '11px', color: 'var(--fg3)' }}>{rango}</div>}

            <div style={{ fontSize: '11px', color: 'var(--fg3)' }}>
                Cliente: {fase.project.clientName}
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {fase.status === 'pendiente' && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => actualizar('en_proceso')}
                        style={{
                            fontSize: '12px',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            background: 'var(--bg-input)',
                            color: 'var(--fg1)',
                            cursor: 'pointer',
                        }}
                    >
                        Iniciar
                    </button>
                )}
                {fase.status !== 'completado' && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => actualizar('completado')}
                        style={{
                            fontSize: '12px',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {loading ? 'Guardando...' : 'Marcar como terminado'}
                    </button>
                )}
                {fase.status === 'completado' && (
                    <span style={{ fontSize: '12px', color: 'var(--accent-hover)' }}>✓ Terminado</span>
                )}
            </div>
        </div>
    )
}
