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

function estatusBadge(status: string) {
    return {
        background:
            status === 'completado'
                ? 'rgba(47,111,237,0.15)'
                : status === 'en_proceso'
                ? 'rgba(224,160,32,0.15)'
                : 'rgba(255,255,255,0.06)',
        color: status === 'completado' ? 'var(--accent-hover)' : status === 'en_proceso' ? '#e0a020' : 'var(--fg3)',
    }
}

function PhaseNode({ node, label, proyecto }: { node: PhaseNodeData; label: string; proyecto?: ProyectoInfo }) {
    const [colapsado, setColapsado] = useState(true)
    const badge = estatusBadge(node.status)

    return (
        <div style={{ marginLeft: node.depth > 0 ? '16px' : 0, marginTop: '8px' }}>
            <div
                style={{
                    border: '1px solid var(--border-subtle)',
                    borderLeft: node.depth === 0 ? '3px solid var(--accent)' : '2px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    background: node.depth === 0 ? 'var(--bg-card)' : 'transparent',
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
                        <span style={{ fontSize: '10px', color: 'var(--fg3)', flexShrink: 0 }}>
                            {colapsado ? '▶' : '▼'}
                        </span>
                        <span
                            style={{
                                fontSize: node.depth === 0 ? '13px' : '12px',
                                fontWeight: node.depth === 0 ? 600 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {label}. {node.title || <em style={{ color: 'var(--fg3)' }}>sin título</em>}
                        </span>
                        {colapsado && (
                            <span style={{ fontSize: '11px', color: 'var(--fg3)', flexShrink: 0 }}>
                                · {node.responsible?.name}
                            </span>
                        )}
                    </button>
                    <span
                        style={{
                            fontSize: '10px',
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
                        <div style={{ fontSize: '11px', color: 'var(--fg3)', marginTop: '4px' }}>
                            Responsable: {node.responsible?.name}
                            {node.estimatedDays != null && ` · ${node.estimatedDays} días estimados`}
                        </div>
                        {node.description && (
                            <div style={{ fontSize: '12px', color: 'var(--fg2)', marginTop: '6px' }}>{node.description}</div>
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
