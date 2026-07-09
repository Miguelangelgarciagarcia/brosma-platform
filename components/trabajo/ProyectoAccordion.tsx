'use client'

import { useState } from 'react'
import FaseCard from '@/components/trabajo/FaseCard'

type FaseConFlags = {
    id: string
    title: string
    description: string | null
    status: string
    startDate: Date | string | null
    endDate: Date | string | null
    project: { folio: string; title: string; clientName: string }
    parent: { title: string } | null
    trabajando: boolean
    retrasado: boolean
}

type Grupo = {
    folio: string
    title: string
    clientName: string
    fases: FaseConFlags[]
}

// Cada proyecto es una card principal (folio, título, cliente y cuántos
// puntos tiene ahí adentro); está colapsada de entrada y con un clic
// despliega todos los puntos de ese proyecto.
export default function ProyectoAccordion({ grupos }: { grupos: Grupo[] }) {
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

    function toggle(folio: string) {
        setExpandidos((prev) => {
            const next = new Set(prev)
            if (next.has(folio)) next.delete(folio)
            else next.add(folio)
            return next
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {grupos.map((grupo) => {
                const abierto = expandidos.has(grupo.folio)
                const hayRetrasados = grupo.fases.some((f) => f.retrasado)
                return (
                    <div
                        key={grupo.folio}
                        style={{
                            background: 'var(--bg-card)',
                            border: `1px solid ${hayRetrasados ? '#e0503a' : 'var(--border-default)'}`,
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => toggle(grupo.folio)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                padding: '14px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent-hover)' }}>
                                    {grupo.folio}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {grupo.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--fg3)' }}>{grupo.clientName}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                {hayRetrasados && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: '#e0503a',
                                            background: 'rgba(224,80,58,0.12)',
                                            borderRadius: '999px',
                                            padding: '2px 8px',
                                        }}
                                    >
                                        ⚠ Retrasado
                                    </span>
                                )}
                                <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>
                                    {grupo.fases.length} punto{grupo.fases.length === 1 ? '' : 's'}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--fg3)' }}>{abierto ? '▼' : '▶'}</span>
                            </div>
                        </button>

                        {abierto && (
                            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {grupo.fases.map((fase) => (
                                    <FaseCard
                                        key={fase.id}
                                        fase={fase}
                                        trabajando={fase.trabajando}
                                        retrasado={fase.retrasado}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
