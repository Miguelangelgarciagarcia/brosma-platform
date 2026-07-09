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

const glassInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '4px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
}

function colorDePunto(status: string) {
    if (status === 'completado') return 'var(--brand-navy)'
    if (status === 'en_proceso') return 'var(--brand-orange)'
    return 'rgba(2,39,58,0.18)'
}

// Anillo circular grande de progreso — el elemento que más debe llamar la
// atención del cliente al entrar a ver su proyecto.
function AnilloProgreso({ progreso, entregado }: { progreso: number; entregado: boolean }) {
    const r = 62
    const circunferencia = 2 * Math.PI * r

    return (
        <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
            <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(2,39,58,0.08)" strokeWidth="12" />
                <circle
                    cx="75"
                    cy="75"
                    r={r}
                    fill="none"
                    stroke="var(--brand-orange)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={circunferencia * (1 - progreso / 100)}
                    style={{ transition: 'stroke-dashoffset 900ms ease' }}
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {entregado ? (
                    <div style={{ fontSize: '38px' }}>✅</div>
                ) : (
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '34px', color: 'var(--brand-navy)', lineHeight: 1 }}>
                        {progreso}%
                    </div>
                )}
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--brand-black-60)',
                        marginTop: '4px',
                    }}
                >
                    {entregado ? 'Entregado' : 'Completado'}
                </div>
            </div>
        </div>
    )
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

    const entregado = resultado?.status === 'entregado'

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-bg-elev)' }}>
            {/* Hero oscuro, misma línea gráfica que el inicio */}
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: `
                        radial-gradient(circle at 12% 15%, rgba(244,123,48,0.20), transparent 45%),
                        linear-gradient(160deg, var(--brand-navy) 0%, var(--brand-navy-deep) 100%)
                    `,
                    paddingBottom: resultado ? '96px' : '56px',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 56px),
                            repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 56px)
                        `,
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-14%',
                        left: '-10%',
                        width: '420px',
                        height: '420px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(244,123,48,0.26) 0%, transparent 70%)',
                        filter: 'blur(10px)',
                        animation: 'brandGlowFloat 12s ease-in-out infinite',
                        pointerEvents: 'none',
                    }}
                />

                <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto', padding: '28px 20px 0', textAlign: 'center' }}>
                    <Link
                        href="/"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: 'var(--brand-white-65)',
                            textDecoration: 'none',
                        }}
                    >
                        ← GRUPO BROSMA
                    </Link>

                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.24em',
                            textTransform: 'uppercase',
                            color: 'var(--brand-orange)',
                            marginTop: '22px',
                            animation: 'brandFadeUp 0.6s ease-out 0.05s both',
                        }}
                    >
                        Seguimiento en línea
                    </div>
                    <h1
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(28px, 6vw, 40px)',
                            lineHeight: 1.1,
                            color: '#ffffff',
                            margin: '10px 0 0',
                            animation: 'brandFadeUp 0.6s ease-out 0.1s both',
                        }}
                    >
                        RASTREA TU PROYECTO
                    </h1>
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--brand-white-65)',
                            fontSize: '14px',
                            marginTop: '10px',
                            lineHeight: 1.5,
                            animation: 'brandFadeUp 0.6s ease-out 0.15s both',
                        }}
                    >
                        Ingresa tu folio y los últimos 4 dígitos del teléfono que registraste.
                    </p>

                    <form
                        onSubmit={buscar}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.16)',
                            backdropFilter: 'blur(14px)',
                            borderRadius: '12px',
                            padding: '22px',
                            marginTop: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            textAlign: 'left',
                            animation: 'brandFadeUp 0.6s ease-out 0.2s both',
                        }}
                    >
                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--brand-white-65)', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                FOLIO
                            </label>
                            <input
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                                placeholder="BRS-260708-1234"
                                required
                                className="brand-glass-input"
                                style={{ ...glassInputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--brand-white-65)', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                ÚLTIMOS 4 DÍGITOS DE TU TELÉFONO
                            </label>
                            <input
                                value={phone4}
                                onChange={(e) => setPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="1234"
                                inputMode="numeric"
                                required
                                className="brand-glass-input"
                                style={glassInputStyle}
                            />
                        </div>

                        {error && <p style={{ color: '#ffb4a3', fontSize: '13px', margin: 0 }}>{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="brand-btn-primary"
                            style={{
                                background: 'var(--brand-orange)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '14px',
                                fontWeight: 700,
                                fontSize: '13px',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                fontFamily: 'var(--font-body)',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 8px 24px rgba(244,123,48,0.35)',
                            }}
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Resultado: card flotante que se monta encima del hero, para que sea
                lo primero que salte a la vista apenas aparece. */}
            {resultado && (
                <div style={{ maxWidth: '520px', margin: '-72px auto 48px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 24px 60px rgba(2,39,58,0.22)',
                            padding: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '22px',
                            animation: 'brandFadeUp 0.6s ease-out both',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div>
                                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--brand-orange)', fontWeight: 700 }}>
                                    {resultado.folio}
                                </div>
                                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0 0' }}>
                                    {resultado.title}
                                </h2>
                            </div>
                            <span
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: '#ffffff',
                                    background: entregado ? 'var(--brand-navy)' : 'var(--brand-orange)',
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}
                            >
                                {entregado ? 'Entregado' : 'En proceso'}
                            </span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                background: 'var(--brand-bg-elev)',
                                borderRadius: '12px',
                                padding: '18px',
                            }}
                        >
                            <AnilloProgreso progreso={resultado.progreso} entregado={entregado} />
                            <div>
                                <div
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: 'var(--brand-black-60)',
                                    }}
                                >
                                    Entrega estimada
                                </div>
                                <div
                                    style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '22px',
                                        color: 'var(--brand-navy)',
                                        marginTop: '4px',
                                    }}
                                >
                                    {formatDate(resultado.entregaEstimada)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: 'var(--brand-black-60)',
                                    marginBottom: '14px',
                                }}
                            >
                                Avance del proyecto
                            </div>

                            <div>
                                {resultado.puntos.map((p, i) => {
                                    const isLast = i === resultado.puntos.length - 1
                                    const color = colorDePunto(p.status)
                                    const enProceso = p.status === 'en_proceso'
                                    return (
                                        <div key={p.key || i} style={{ position: 'relative', paddingLeft: '34px', paddingBottom: isLast ? 0 : '22px' }}>
                                            {!isLast && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        left: '9px',
                                                        top: '22px',
                                                        bottom: 0,
                                                        width: '2px',
                                                        background: p.status === 'completado' ? 'var(--brand-navy)' : 'rgba(2,39,58,0.12)',
                                                    }}
                                                />
                                            )}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '1px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    background: p.status === 'completado' ? 'var(--brand-navy)' : '#ffffff',
                                                    border: `2px solid ${color}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    animation: enProceso ? 'brandPulse 1.6s ease-in-out infinite' : 'none',
                                                }}
                                            >
                                                {p.status === 'completado' && (
                                                    <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>
                                                )}
                                                {enProceso && (
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-orange)' }} />
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: 'var(--font-body)',
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    color: p.status === 'pendiente' ? 'var(--brand-black-40)' : 'var(--brand-navy)',
                                                }}
                                            >
                                                {i + 1}. {p.label}
                                            </div>
                                            {p.subpuntos && p.subpuntos.length > 0 && (
                                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {p.subpuntos.map((s, j) => (
                                                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span
                                                                style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: colorDePunto(s.status),
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-black-60)' }}>
                                                                {s.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
