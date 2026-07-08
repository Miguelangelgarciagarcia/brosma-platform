'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/dates'

type Punto = {
    key: string | null
    label: string
    status: string
    subpuntos?: { title: string; status: string }[]
}

type Resultado = {
    folio: string
    title: string
    status: string
    progreso: number
    entregaEstimada: string | null
    puntos: Punto[]
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    color: 'var(--fg1)',
    fontSize: '14px',
}

function iconoEstatus(status: string) {
    if (status === 'completado') return '✅'
    if (status === 'en_proceso') return '🟡'
    return '⚪'
}

export default function SeguimientoPage() {
    const [folio, setFolio] = useState('')
    const [phone4, setPhone4] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resultado, setResultado] = useState<Resultado | null>(null)

    async function buscar(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setResultado(null)

        try {
            const res = await fetch('/api/seguimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folio: folio.trim(), phone4: phone4.trim() }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al consultar')
            setResultado(json)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '32px 16px',
                gap: '24px',
            }}
        >
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Link href="/" style={{ fontSize: '13px', color: 'var(--fg2)', textDecoration: 'none' }}>
                        ← Brosma
                    </Link>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px' }}>Rastrea tu proyecto</h1>
                    <p style={{ fontSize: '13px', color: 'var(--fg2)', margin: 0 }}>
                        Ingresa tu folio y los últimos 4 dígitos del teléfono que registraste.
                    </p>
                </div>

                <form
                    onSubmit={buscar}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div>
                        <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                            Folio
                        </label>
                        <input
                            value={folio}
                            onChange={(e) => setFolio(e.target.value)}
                            placeholder="BRS-260708-1234"
                            required
                            style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                            Últimos 4 dígitos de tu teléfono
                        </label>
                        <input
                            value={phone4}
                            onChange={(e) => setPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="1234"
                            inputMode="numeric"
                            required
                            style={inputStyle}
                        />
                    </div>

                    {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>
            </div>

            {resultado && (
                <div
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent-hover)' }}>
                            {resultado.folio}
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0' }}>{resultado.title}</h2>
                        <div style={{ fontSize: '12px', color: 'var(--fg2)' }}>
                            Entrega estimada: {formatDate(resultado.entregaEstimada)}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--fg2)', marginBottom: '4px' }}>
                            <span>Progreso</span>
                            <span>{resultado.progreso}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '999px' }}>
                            <div
                                style={{
                                    width: `${resultado.progreso}%`,
                                    height: '6px',
                                    borderRadius: '999px',
                                    background: 'var(--accent)',
                                    transition: 'width 400ms ease',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {resultado.puntos.map((p, i) => (
                            <div key={p.key || i}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{iconoEstatus(p.status)}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        {i + 1}. {p.label}
                                    </span>
                                </div>
                                {p.subpuntos && p.subpuntos.length > 0 && (
                                    <div style={{ marginLeft: '26px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {p.subpuntos.map((s, j) => (
                                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '11px' }}>{iconoEstatus(s.status)}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--fg2)' }}>{s.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
