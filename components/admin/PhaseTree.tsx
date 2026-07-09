'use client'

import { useState } from 'react'
import { esPuntoSoloEstatus } from '@/lib/main-points'
import MarcarEstatusButton from '@/components/admin/MarcarEstatusButton'

type PhaseNodeData = {
    id: string
    depth: number
    mainPointKey: string | null
    title: string
    description: string | null
    status: string
    estimatedDays: number | null
    responsible: { name: string }
    children: PhaseNodeData[]
}

type ProyectoInfo = {
    folio: string
    title: string
    clientName: string
    email: string | null
}

// Mismo lenguaje visual que el badge de estatus en /seguimiento: naranja
// para "en proceso" (llama la atención), un tono neutro más claro para
// "completado" (ya se resolvió, no necesita más atención) y tenue para
// "pendiente".
function estatusBadge(status: string) {
    return {
        background:
            status === 'completado'
                ? 'rgba(255,255,255,0.14)'
                : status === 'en_proceso'
                ? 'rgba(244,123,48,0.18)'
                : 'rgba(255,255,255,0.06)',
        color: status === 'completado' ? '#ffffff' : status === 'en_proceso' ? 'var(--brand-orange)' : 'var(--brand-panel-fg3)',
    }
}

function PhaseNode({ node, label, proyecto }: { node: PhaseNodeData; label: string; proyecto?: ProyectoInfo }) {
    const [colapsado, setColapsado] = useState(true)
    const badge = estatusBadge(node.status)

    return (
        <div style={{ marginLeft: node.depth > 0 ? '16px' : 0, marginTop: '8px' }}>
            <div
                style={{
                    border: '1px solid var(--brand-panel-border)',
                    borderLeft: node.depth === 0 ? '3px solid var(--brand-orange)' : '2px solid var(--brand-panel-border)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    background: node.depth === 0 ? 'var(--brand-panel-card)' : 'transparent',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setColapsado((v) => !v)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                            minWidth: 0,
                        }}
                    >
                        <span style={{ fontSize: '10px', color: 'var(--brand-panel-fg3)', flexShrink: 0 }}>
                            {colapsado ? '▶' : '▼'}
                        </span>
                        <span
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: node.depth === 0 ? '13px' : '12px',
                                fontWeight: node.depth === 0 ? 700 : 400,
                                color: 'var(--brand-panel-fg)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {label}. {node.title || <em style={{ color: 'var(--brand-panel-fg3)' }}>sin título</em>}
                        </span>
                        {colapsado && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', flexShrink: 0 }}>
                                · {node.responsible?.name}
                            </span>
                        )}
                    </button>
                    <span
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            flexShrink: 0,
                            ...badge,
                        }}
                    >
                        {node.status}
                    </span>
                </div>

                {!colapsado && (
                    <>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', marginTop: '4px' }}>
                            Responsable: {node.responsible?.name}
                            {node.estimatedDays != null && ` · ${node.estimatedDays} días estimados`}
                        </div>
                        {node.description && (
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-panel-fg2)', marginTop: '6px' }}>
                                {node.description}
                            </div>
                        )}
                        {node.depth === 0 && esPuntoSoloEstatus(node.mainPointKey ?? '') && node.status !== 'completado' && (
                            <MarcarEstatusButton phaseId={node.id} mainPointKey={node.mainPointKey} proyecto={proyecto} />
                        )}
                    </>
                )}
            </div>
            {!colapsado &&
                node.children.map((child, i) => (
                    <PhaseNode key={child.id} node={child} label={`${label}.${i + 1}`} proyecto={proyecto} />
                ))}
        </div>
    )
}

export default function PhaseTree({ nodes, proyecto }: { nodes: PhaseNodeData[]; proyecto?: ProyectoInfo }) {
    return (
        <>
            {nodes.map((node, i) => (
                <PhaseNode key={node.id} node={node} label={`${i + 1}`} proyecto={proyecto} />
            ))}
        </>
    )
}
