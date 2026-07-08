'use client'

export type SubpointNode = {
    clientId: string
    title: string
    description: string
    responsibleId: string
    startDate: string
    endDate: string
    children: SubpointNode[]
}

export function nuevoSubpunto(): SubpointNode {
    return {
        clientId: Math.random().toString(36).slice(2),
        title: '',
        description: '',
        responsibleId: '',
        startDate: '',
        endDate: '',
        children: [],
    }
}

type Trabajador = { id: string; name: string }

type Props = {
    nodes: SubpointNode[]
    onChange: (nodes: SubpointNode[]) => void
    trabajadores: Trabajador[]
    depth?: number
    pathLabel?: string
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px',
    color: 'var(--fg1)',
    fontSize: '13px',
}

export default function SubpointEditor({ nodes, onChange, trabajadores, depth = 1, pathLabel = '' }: Props) {
    function updateNode(index: number, patch: Partial<SubpointNode>) {
        const next = nodes.map((n, i) => (i === index ? { ...n, ...patch } : n))
        onChange(next)
    }

    function removeNode(index: number) {
        onChange(nodes.filter((_, i) => i !== index))
    }

    function addNode() {
        onChange([...nodes, nuevoSubpunto()])
    }

    function updateChildren(index: number, children: SubpointNode[]) {
        updateNode(index, { children })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: depth > 1 ? '18px' : 0 }}>
            {nodes.map((node, index) => {
                const label = pathLabel ? `${pathLabel}.${index + 1}` : `${index + 1}`
                return (
                    <div
                        key={node.clientId}
                        style={{
                            border: '1px solid var(--border-subtle)',
                            borderLeft: '2px solid var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--accent-hover)', fontFamily: 'monospace' }}>
                                Subpunto {label}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeNode(index)}
                                style={{ background: 'none', border: 'none', color: '#e0503a', fontSize: '11px', cursor: 'pointer' }}
                            >
                                Eliminar
                            </button>
                        </div>

                        <input
                            placeholder="Título corto"
                            value={node.title}
                            onChange={(e) => updateNode(index, { title: e.target.value })}
                            style={inputStyle}
                        />
                        <textarea
                            placeholder="Descripción larga (uso interno)"
                            value={node.description}
                            onChange={(e) => updateNode(index, { description: e.target.value })}
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical' as const }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <select
                                value={node.responsibleId}
                                onChange={(e) => updateNode(index, { responsibleId: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Responsable...</option>
                                {trabajadores.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={node.startDate}
                                onChange={(e) => updateNode(index, { startDate: e.target.value })}
                                style={{ ...inputStyle, colorScheme: 'dark' }}
                            />
                            <input
                                type="date"
                                value={node.endDate}
                                onChange={(e) => updateNode(index, { endDate: e.target.value })}
                                style={{ ...inputStyle, colorScheme: 'dark' }}
                            />
                        </div>

                        <SubpointEditor
                            nodes={node.children}
                            onChange={(children) => updateChildren(index, children)}
                            trabajadores={trabajadores}
                            depth={depth + 1}
                            pathLabel={label}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                updateChildren(index, [...node.children, nuevoSubpunto()])
                            }
                            style={{
                                alignSelf: 'flex-start',
                                fontSize: '11px',
                                color: 'var(--accent-hover)',
                                background: 'none',
                                border: '1px dashed var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                cursor: 'pointer',
                            }}
                        >
                            + Sub-subpunto de {label}
                        </button>
                    </div>
                )
            })}

            <button
                type="button"
                onClick={addNode}
                style={{
                    alignSelf: 'flex-start',
                    fontSize: '12px',
                    color: 'var(--accent-hover)',
                    background: 'none',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                }}
            >
                + Agregar subpunto {pathLabel ? `de ${pathLabel}` : ''}
            </button>
        </div>
    )
}
