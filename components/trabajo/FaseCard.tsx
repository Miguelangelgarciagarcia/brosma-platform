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
    // Resalta la card (se usa en la sección "Corriendo hoy").
    destacado?: boolean
    // Ya se marcó "Iniciar" y sigue sin terminar.
    trabajando?: boolean
    // Ya pasó la fecha de fin y sigue sin terminar.
    retrasado?: boolean
}

function formatDate(d: Date | string | null) {
    if (!d) return null
    const date = typeof d === 'string' ? new Date(d) : d
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date)
}

export default function FaseCard({ fase, destacado, trabajando, retrasado }: Props) {
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
            className="admin-content-card"
            style={{
                border: `1px solid ${retrasado ? '#f3b3b2' : destacado ? 'var(--brand-orange)' : 'var(--admin-card-border)'}`,
                borderLeft: `3px solid ${
                    retrasado
                        ? 'var(--admin-icon-red-fg)'
                        : fase.status === 'completado'
                        ? 'var(--admin-text-tertiary)'
                        : fase.status === 'en_proceso'
                        ? 'var(--brand-orange)'
                        : 'var(--admin-card-border)'
                }`,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: retrasado ? 'brandBlinkAtrasoLight 1.6s ease-in-out infinite' : 'none',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--admin-text-tertiary)' }}>
                    {fase.project.folio} · {fase.project.title}
                </div>
                {(trabajando || retrasado) && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {retrasado && (
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--admin-icon-red-fg)',
                                    background: 'var(--admin-icon-red-bg)',
                                    borderRadius: '999px',
                                    padding: '2px 8px',
                                }}
                            >
                                <span
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: 'var(--admin-icon-red-fg)',
                                        flexShrink: 0,
                                        animation: 'brandBlinkDot 1s ease-in-out infinite',
                                    }}
                                />
                                Retrasado{!trabajando ? ' · sin iniciar' : ''}
                            </span>
                        )}
                        {trabajando && (
                            <span
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--brand-orange)',
                                    background: 'var(--admin-icon-orange-bg)',
                                    borderRadius: '999px',
                                    padding: '2px 8px',
                                }}
                            >
                                ▶ Trabajando
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                {fase.parent ? `${fase.parent.title} → ` : ''}
                {fase.title}
            </div>

            {fase.description && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{fase.description}</div>
            )}

            {rango && <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{rango}</div>}

            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>
                Cliente: {fase.project.clientName}
            </div>

            {error && <p style={{ fontFamily: 'var(--font-body)', color: 'var(--admin-icon-red-fg)', fontSize: '12px', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {fase.status === 'pendiente' && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => actualizar('en_proceso')}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-card-border)',
                            background: '#ffffff',
                            color: 'var(--admin-text-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        Iniciar
                    </button>
                )}
                {fase.status === 'en_proceso' && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de marcar este punto como terminado?')) {
                                actualizar('completado')
                            }
                        }}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--brand-orange)',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? 'Guardando...' : 'Marcar como terminado'}
                    </button>
                )}
                {fase.status === 'completado' && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-success-fg)', fontWeight: 700 }}>
                        ✓ Terminado
                    </span>
                )}
            </div>
        </div>
    )
}
