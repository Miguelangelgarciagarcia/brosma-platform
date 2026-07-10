'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/dates'
import Aurora from '@/components/reactbits/Aurora'
import BlurText from '@/components/reactbits/BlurText'
import StarBorder from '@/components/reactbits/StarBorder'

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

// Colores pensados para el card oscuro (antes vivían pensados para un card
// blanco): completado en blanco (se "prende"), en proceso en naranja (el
// acento que llama la atención), pendiente apenas insinuado.
function colorDePunto(status: string) {
    if (status === 'completado') return '#ffffff'
    if (status === 'en_proceso') return 'var(--brand-orange)'
    return 'rgba(255,255,255,0.25)'
}

// Anillo circular grande de progreso — el elemento que más debe llamar la
// atención del cliente al entrar a ver su proyecto. El número dentro cuenta
// hacia arriba desde 0 al mismo ritmo que se llena el anillo, para que se
// sienta como un solo movimiento (no un valor estático que aparece de golpe).
function AnilloProgreso({ progreso, entregado }: { progreso: number; entregado: boolean }) {
    const r = 62
    const circunferencia = 2 * Math.PI * r
    const [animado, setAnimado] = useState(0)

    useEffect(() => {
        setAnimado(0)
        const inicio = performance.now()
        const duracion = 900
        let frame = 0
        function tick(t: number) {
            const avance = Math.min(1, (t - inicio) / duracion)
            setAnimado(Math.round(avance * progreso))
            if (avance < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [progreso])

    return (
        <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
            <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
                <circle
                    cx="75"
                    cy="75"
                    r={r}
                    fill="none"
                    stroke="var(--brand-orange)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={circunferencia * (1 - animado / 100)}
                    style={{ transition: 'stroke-dashoffset 100ms linear' }}
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
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '34px', color: '#ffffff', lineHeight: 1 }}>
                        {animado}%
                    </div>
                )}
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--brand-white-65)',
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

    // El campo "Entrega estimada" deja de mostrar una fecha en cuanto ya no
    // tiene caso: si "Listo para Entrega" ya se completó (pero "Entregado"
    // todavía no), la entrega es inmediata; si "Entregado" ya se completó,
    // ya no hay nada que estimar, el proyecto ya se entregó.
    const listoParaEntrega = resultado?.puntos.find((p) => p.key === 'listo_entrega')?.status === 'completado'
    const yaEntregado = resultado?.puntos.find((p) => p.key === 'entregado')?.status === 'completado'
    const entregaTexto = yaEntregado ? 'Entregado' : listoParaEntrega ? 'Inmediata' : formatDate(resultado?.entregaEstimada ?? null)

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-navy-deep)' }}>
            {/* Hero oscuro, misma línea gráfica que el inicio — ahora con Aurora
                (React Bits) como fondo animado en vez del glow estático solo. */}
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--brand-navy-deep)',
                    paddingBottom: resultado ? '96px' : '56px',
                }}
            >
                <div style={{ position: 'absolute', inset: 0 }}>
                    <Aurora colorStops={['#02273a', '#f47b30', '#02273a']} amplitude={0.9} blend={0.55} speed={0.6} />
                </div>

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
                    <div style={{ marginTop: '10px' }}>
                        <BlurText
                            text="RASTREA TU PROYECTO"
                            animateBy="words"
                            direction="top"
                            delay={80}
                            className="brand-seguimiento-heading"
                        />
                    </div>
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

                        <StarBorder
                            as="button"
                            type="submit"
                            disabled={loading}
                            color="#ffffff"
                            speed="4s"
                            style={{ width: '100%', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </StarBorder>
                    </form>
                </div>
            </div>

            {/* Resultado: card flotante que se monta encima del hero, para que sea
                lo primero que salte a la vista apenas aparece. */}
            {resultado && (
                <div style={{ maxWidth: '520px', margin: '-72px auto 48px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(18px)',
                            borderRadius: '16px',
                            boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
                            overflow: 'hidden',
                            animation: 'brandFadeUp 0.6s ease-out both',
                        }}
                    >
                        <div className="brand-result-accent" />
                        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div>
                                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--brand-orange)', fontWeight: 700 }}>
                                    {resultado.folio}
                                </div>
                                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0' }}>
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
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '20px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: '18px',
                            }}
                        >
                            <AnilloProgreso progreso={resultado.progreso} entregado={entregado} />
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: 'var(--brand-white-65)',
                                    }}
                                >
                                    Entrega estimada
                                </div>
                                <div
                                    style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '22px',
                                        color: '#ffffff',
                                        marginTop: '4px',
                                    }}
                                >
                                    {entregaTexto}
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
                                    color: 'var(--brand-white-65)',
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
                                        <div
                                            key={p.key || i}
                                            style={{
                                                position: 'relative',
                                                paddingLeft: '34px',
                                                paddingBottom: isLast ? 0 : '22px',
                                                animation: `brandFadeUp 0.45s ease-out ${0.35 + i * 0.08}s both`,
                                            }}
                                        >
                                            {!isLast && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        left: '9px',
                                                        top: '22px',
                                                        bottom: 0,
                                                        width: '2px',
                                                        background: p.status === 'completado' ? 'var(--brand-orange)' : 'rgba(255,255,255,0.15)',
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
                                                    background: p.status === 'completado' ? '#ffffff' : 'transparent',
                                                    border: `2px solid ${color}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    animation: enProceso ? 'brandPulse 1.6s ease-in-out infinite' : 'none',
                                                }}
                                            >
                                                {p.status === 'completado' && (
                                                    <span style={{ color: 'var(--brand-navy)', fontSize: '11px', lineHeight: 1, fontWeight: 700 }}>✓</span>
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
                                                    color: p.status === 'pendiente' ? 'rgba(255,255,255,0.35)' : '#ffffff',
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
                                                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-white-65)' }}>
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
                </div>
            )}
        </main>
    )
}
