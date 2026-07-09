'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type MainPointTemplateData = {
    id: string
    key: string
    label: string
    order: number
    fixed: boolean
    active: boolean
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--brand-panel-input)',
    border: '1px solid var(--brand-panel-border)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--brand-panel-fg)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
}

const btnStyle: React.CSSProperties = {
    background: 'var(--brand-panel-card-hover)',
    border: '1px solid var(--brand-panel-border)',
    color: 'var(--brand-panel-fg)',
    fontFamily: 'var(--font-body)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
}

// Gestión del catálogo configurable de Puntos Principales (Fase "cambio
// grande"): el Admin puede agregar, renombrar, reordenar y
// desactivar/reactivar los puntos configurables. Los 2 puntos fijos (Listo
// para Entrega / Entregado) se muestran al final, bloqueados, sin ninguna
// acción disponible.
//
// Importante: nada de lo que se haga aquí afecta proyectos ya existentes
// (ni registrados ni borradores) — es solo la plantilla que se copia la
// próxima vez que se cree un proyecto nuevo.
export default function MainPointCatalogManager({ initial }: { initial: MainPointTemplateData[] }) {
    const router = useRouter()
    const [puntos, setPuntos] = useState(initial)
    const [nuevoLabel, setNuevoLabel] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')

    const configurables = puntos.filter((p) => !p.fixed).sort((a, b) => a.order - b.order)
    const fijos = puntos.filter((p) => p.fixed).sort((a, b) => a.order - b.order)

    async function refrescar() {
        const res = await fetch('/api/main-point-templates')
        if (res.ok) setPuntos(await res.json())
        router.refresh()
    }

    async function agregarPunto() {
        if (!nuevoLabel.trim()) return
        setCargando(true)
        setError('')
        try {
            const res = await fetch('/api/main-point-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: nuevoLabel.trim() }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al agregar el punto')
            setNuevoLabel('')
            await refrescar()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    async function actualizarPunto(id: string, patch: { label?: string; active?: boolean; move?: 'up' | 'down' }) {
        setCargando(true)
        setError('')
        try {
            const res = await fetch(`/api/main-point-templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al actualizar el punto')
            await refrescar()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', margin: 0 }}>
                Estos son los puntos que se ofrecen al crear un proyecto nuevo. Cambiar, agregar, reordenar o
                desactivar un punto aquí <strong style={{ color: 'var(--brand-panel-fg2)' }}>no afecta proyectos ya existentes</strong> —
                solo aplica a los que se creen de ahora en adelante.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {configurables.map((p, i) => (
                    <div
                        key={p.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            background: 'var(--brand-panel-card)',
                            border: '1px solid var(--brand-panel-border)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            opacity: p.active ? 1 : 0.55,
                        }}
                    >
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', width: '18px', flexShrink: 0 }}>
                            {i + 1}.
                        </span>
                        <input
                            defaultValue={p.label}
                            disabled={cargando}
                            onBlur={(e) => {
                                const v = e.target.value.trim()
                                if (v && v !== p.label) actualizarPunto(p.id, { label: v })
                            }}
                            className="brand-panel-input"
                            style={{ ...inputStyle, flex: '1 1 140px' }}
                        />
                        {/* Botones agrupados: en pantallas angostas se van juntos a su
                            propia línea (debajo del nombre) en vez de comprimirse. */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
                            <button
                                type="button"
                                disabled={cargando || i === 0}
                                onClick={() => actualizarPunto(p.id, { move: 'up' })}
                                style={{ ...btnStyle, opacity: i === 0 ? 0.4 : 1 }}
                                title="Subir"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                disabled={cargando || i === configurables.length - 1}
                                onClick={() => actualizarPunto(p.id, { move: 'down' })}
                                style={{ ...btnStyle, opacity: i === configurables.length - 1 ? 0.4 : 1 }}
                                title="Bajar"
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                disabled={cargando}
                                onClick={() => actualizarPunto(p.id, { active: !p.active })}
                                style={{ ...btnStyle, whiteSpace: 'nowrap' }}
                            >
                                {p.active ? 'Desactivar' : 'Reactivar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <input
                    value={nuevoLabel}
                    onChange={(e) => setNuevoLabel(e.target.value)}
                    placeholder="Nombre del nuevo punto"
                    className="brand-panel-input"
                    style={{ ...inputStyle, flex: '1 1 180px' }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') agregarPunto()
                    }}
                />
                <button
                    type="button"
                    disabled={cargando || !nuevoLabel.trim()}
                    onClick={agregarPunto}
                    style={{ ...btnStyle, whiteSpace: 'nowrap', background: 'var(--brand-orange)', color: '#fff', border: 'none', flexShrink: 0 }}
                >
                    + Agregar punto
                </button>
            </div>

            {error && <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <p
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'var(--brand-panel-fg3)',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                    }}
                >
                    Puntos fijos (no editables)
                </p>
                {fijos.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--brand-panel-bg)',
                            border: '1px solid var(--brand-panel-border)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            color: 'var(--brand-panel-fg3)',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        🔒 <span style={{ fontSize: '13px' }}>{p.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
