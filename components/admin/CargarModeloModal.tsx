'use client'

import { useEffect, useState } from 'react'

type ResultadoProyecto = {
    folio: string
    title: string
    clientName: string
    company: string | null
    status: string
    createdAt: string
}

type Props = {
    onElegir: (folio: string) => void
    onCerrar: () => void
    cargando: boolean
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
}

export default function CargarModeloModal({ onElegir, onCerrar, cargando }: Props) {
    const [q, setQ] = useState('')
    const [resultados, setResultados] = useState<ResultadoProyecto[]>([])
    const [buscando, setBuscando] = useState(true)

    useEffect(() => {
        setBuscando(true)
        const timeout = setTimeout(() => {
            fetch(`/api/proyectos/buscar?q=${encodeURIComponent(q)}`)
                .then((r) => r.json())
                .then((data) => setResultados(Array.isArray(data) ? data : []))
                .finally(() => setBuscando(false))
        }, 300)
        return () => clearTimeout(timeout)
    }, [q])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                className="admin-content-card"
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-body)', margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        Cargar modelo
                    </h3>
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="admin-password-toggle"
                        style={{ position: 'static', fontSize: '18px' }}
                    >
                        ✕
                    </button>
                </div>

                <p style={{ fontFamily: 'var(--font-body)', margin: 0, fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                    Elige un proyecto ya registrado para copiar su estructura de puntos y subpuntos (fechas y
                    responsables incluidos). Los puntos que coincidan con el catálogo actual se llenan; los que no
                    tengan coincidencia quedan vacíos, y las fechas se recorren para que arranquen hoy.
                </p>

                <input
                    autoFocus
                    placeholder="Buscar por folio, título o cliente..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="admin-input"
                    style={inputStyle}
                    disabled={cargando}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {buscando && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                            Buscando...
                        </p>
                    )}
                    {!buscando && resultados.length === 0 && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                            No se encontraron proyectos registrados con ese criterio.
                        </p>
                    )}
                    {!buscando &&
                        resultados.map((p) => (
                            <button
                                key={p.folio}
                                type="button"
                                disabled={cargando}
                                onClick={() => onElegir(p.folio)}
                                className="admin-subpanel"
                                style={{
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    opacity: cargando ? 0.6 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                }}
                            >
                                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--brand-orange)' }}>{p.folio}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                    {p.title}
                                </span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>
                                    {p.clientName}
                                    {p.company ? ` · ${p.company}` : ''} · {p.status === 'entregado' ? 'Entregado' : 'En proceso'}
                                </span>
                            </button>
                        ))}
                    {cargando && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', margin: 0 }}>
                            Cargando estructura...
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
