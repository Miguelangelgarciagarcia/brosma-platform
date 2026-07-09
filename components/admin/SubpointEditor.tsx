'use client'

import { useState } from 'react'

export type SubpointNode = {
    clientId: string
    // Id real en la base de datos (Phase.id). Undefined = subpunto nuevo que
    // todavía no existe en la BD. Se usa al editar un proyecto YA
    // registrado, para actualizar en vez de borrar+recrear y así no perder
    // el progreso (status/completedAt) que ya haya marcado un trabajador.
    id?: string
    // Estatus real en la BD (solo presente al editar un proyecto ya
    // registrado). Si ya está "completado", el subpunto se bloquea en la UI:
    // no se puede editar ni eliminar.
    status?: string
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
        id: undefined,
        status: undefined,
        title: '',
        description: '',
        responsibleId: '',
        startDate: '',
        endDate: '',
        children: [],
    }
}

export function esCompletado(node: SubpointNode): boolean {
    return node.status === 'completado'
}

// Duración en días naturales (incluye domingos: un subpunto "dura" lo que
// dura sin importar qué día caiga, a diferencia de la fecha de entrega
// general que sí brinca domingos).
export function duracionDias(start: string, end: string): number {
    if (!start || !end) return 0
    const s = new Date(start + 'T00:00:00')
    const e = new Date(end + 'T00:00:00')
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
    return diff > 0 ? diff : 0
}

// Un subpunto está "completo" cuando ya se puede confiar en su info para
// derivar cosas de él (crear hijos, sumar sus días, etc.)
export function nodoCompleto(node: SubpointNode): boolean {
    return !!(node.title.trim() && node.responsibleId && node.startDate && node.endDate)
}

function tieneInfo(node: SubpointNode): boolean {
    return !!(
        node.title.trim() ||
        node.description.trim() ||
        node.responsibleId ||
        node.startDate ||
        node.endDate ||
        node.children.length > 0
    )
}

type Trabajador = { id: string; name: string }

type Props = {
    nodes: SubpointNode[]
    onChange: (nodes: SubpointNode[]) => void
    trabajadores: Trabajador[]
    depth?: number
    pathLabel?: string
    parentStart?: string
    parentEnd?: string
    // false = el nodo dueño de este listado de hijos todavía no tiene
    // título/responsable/fechas -> no se puede agregar nada aquí adentro.
    // undefined = no aplica (nivel más alto, directo bajo el punto principal).
    parentCompleto?: boolean
    // true = los subpuntos que ya vienen cargados (con id real) empiezan
    // minimizados, para no ver todo el árbol abierto de un jalón. Se usa al
    // editar un proyecto YA registrado; al crear/editar un borrador se deja
    // todo expandido porque se está llenando activamente. Los subpuntos
    // nuevos que se agreguen después sí abren expandidos.
    defaultColapsado?: boolean
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

export default function SubpointEditor({
    nodes,
    onChange,
    trabajadores,
    depth = 1,
    pathLabel = '',
    parentStart,
    parentEnd,
    parentCompleto,
    defaultColapsado,
}: Props) {
    // Solo se usa al montar: colapsa de entrada los subpuntos que ya
    // existían (con id real) si el llamador lo pidió. Los que se agreguen
    // después con "+ Agregar subpunto" no entran aquí, así que abren
    // expandidos como siempre.
    const [colapsados, setColapsados] = useState<Set<string>>(() =>
        defaultColapsado ? new Set(nodes.filter((n) => n.id).map((n) => n.clientId)) : new Set()
    )

    function updateNode(index: number, patch: Partial<SubpointNode>) {
        const next = nodes.map((n, i) => (i === index ? { ...n, ...patch } : n))
        onChange(next)
    }

    function removeNode(index: number) {
        const node = nodes[index]
        if (tieneInfo(node)) {
            const ok = window.confirm(
                `¿Seguro que quieres eliminar "${node.title || 'este subpunto'}"? Se perderá toda su información y la de sus sub-subpuntos.`
            )
            if (!ok) return
        }
        onChange(nodes.filter((_, i) => i !== index))
    }

    function addNode() {
        onChange([...nodes, nuevoSubpunto()])
    }

    function updateChildren(index: number, children: SubpointNode[]) {
        updateNode(index, { children })
    }

    function toggleColapsado(clientId: string) {
        setColapsados((prev) => {
            const next = new Set(prev)
            if (next.has(clientId)) next.delete(clientId)
            else next.add(clientId)
            return next
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: depth > 1 ? '18px' : 0 }}>
            {nodes.map((node, index) => {
                const label = pathLabel ? `${pathLabel}.${index + 1}` : `${index + 1}`
                const colapsado = colapsados.has(node.clientId)
                const completo = nodoCompleto(node)
                // Un subpunto que un trabajador ya marcó como completado no
                // se puede editar ni eliminar desde aquí (se protege también
                // en el servidor, esto es nada más para la UI).
                const bloqueado = esCompletado(node)

                const fechasInvertidas = !!(node.startDate && node.endDate && node.startDate > node.endDate)
                const fueraDeRangoPadre = !!(
                    (parentStart && node.startDate && node.startDate < parentStart) ||
                    (parentEnd && node.endDate && node.endDate > parentEnd)
                )
                const dias = duracionDias(node.startDate, node.endDate)

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
                            <button
                                type="button"
                                onClick={() => toggleColapsado(node.clientId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                <span style={{ fontSize: '10px', color: 'var(--fg3)' }}>{colapsado ? '▶' : '▼'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--accent-hover)', fontFamily: 'monospace' }}>
                                    Subpunto {label}
                                </span>
                                {colapsado && (
                                    <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>
                                        {node.title || <em style={{ color: 'var(--fg3)' }}>sin título</em>}
                                        {dias > 0 && ` · ${dias} día${dias === 1 ? '' : 's'}`}
                                    </span>
                                )}
                                {bloqueado && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: 'var(--accent-hover)',
                                            background: 'rgba(47,111,237,0.12)',
                                            borderRadius: '999px',
                                            padding: '2px 8px',
                                        }}
                                    >
                                        ✓ Completado
                                    </span>
                                )}
                            </button>
                            {!bloqueado && (
                                <button
                                    type="button"
                                    onClick={() => removeNode(index)}
                                    style={{ background: 'none', border: 'none', color: '#e0503a', fontSize: '11px', cursor: 'pointer' }}
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>

                        {!colapsado && bloqueado && (
                            <p style={{ fontSize: '11px', color: 'var(--fg3)', margin: 0 }}>
                                Este subpunto ya lo marcó como completado un trabajador: no se puede editar ni eliminar.
                            </p>
                        )}

                        {!colapsado && (
                            <>
                                <input
                                    placeholder="Título corto"
                                    value={node.title}
                                    disabled={bloqueado}
                                    onChange={(e) => updateNode(index, { title: e.target.value })}
                                    style={{ ...inputStyle, opacity: bloqueado ? 0.6 : 1 }}
                                />
                                <textarea
                                    placeholder="Descripción larga (uso interno)"
                                    value={node.description}
                                    disabled={bloqueado}
                                    onChange={(e) => updateNode(index, { description: e.target.value })}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' as const, opacity: bloqueado ? 0.6 : 1 }}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <select
                                        value={node.responsibleId}
                                        disabled={bloqueado}
                                        onChange={(e) => updateNode(index, { responsibleId: e.target.value })}
                                        style={{ ...inputStyle, opacity: bloqueado ? 0.6 : 1 }}
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
                                        min={parentStart || undefined}
                                        max={parentEnd || undefined}
                                        disabled={bloqueado}
                                        onChange={(e) => updateNode(index, { startDate: e.target.value })}
                                        style={{ ...inputStyle, colorScheme: 'dark', opacity: bloqueado ? 0.6 : 1 }}
                                    />
                                    <input
                                        type="date"
                                        value={node.endDate}
                                        min={node.startDate || parentStart || undefined}
                                        max={parentEnd || undefined}
                                        disabled={bloqueado}
                                        onChange={(e) => updateNode(index, { endDate: e.target.value })}
                                        style={{ ...inputStyle, colorScheme: 'dark', opacity: bloqueado ? 0.6 : 1 }}
                                    />
                                </div>

                                {fechasInvertidas && (
                                    <p style={{ color: '#ff6b6b', fontSize: '11px', margin: 0 }}>
                                        La fecha final no puede ser anterior a la fecha de inicio.
                                    </p>
                                )}
                                {!fechasInvertidas && fueraDeRangoPadre && (
                                    <p style={{ color: '#ff6b6b', fontSize: '11px', margin: 0 }}>
                                        Las fechas deben estar dentro del rango de "{pathLabel}" ({parentStart} a {parentEnd}).
                                    </p>
                                )}
                                {!fechasInvertidas && !fueraDeRangoPadre && dias > 0 && (
                                    <p style={{ color: 'var(--fg3)', fontSize: '11px', margin: 0 }}>
                                        Duración: {dias} día{dias === 1 ? '' : 's'} (cuenta todos los días del rango, incluyendo domingos).
                                    </p>
                                )}

                                <SubpointEditor
                                    nodes={node.children}
                                    onChange={(children) => updateChildren(index, children)}
                                    trabajadores={trabajadores}
                                    depth={depth + 1}
                                    pathLabel={label}
                                    parentStart={node.startDate || undefined}
                                    parentEnd={node.endDate || undefined}
                                    parentCompleto={completo}
                                    defaultColapsado={defaultColapsado}
                                />
                            </>
                        )}
                    </div>
                )
            })}

            {(() => {
                // No se puede agregar aquí si el nodo dueño de esta lista (el
                // padre) todavía no está completo, o si el último hermano que
                // ya está en la lista sigue sin llenarse (se completa uno
                // antes de abrir el siguiente).
                const bloqueadoPorPadre = parentCompleto === false
                const hermanoIncompleto = nodes.some((n) => !nodoCompleto(n))
                const bloqueado = bloqueadoPorPadre || hermanoIncompleto
                const motivo = bloqueadoPorPadre
                    ? `Completa título, responsable y fechas de "${pathLabel}" antes de agregarle subpuntos.`
                    : hermanoIncompleto
                    ? 'Completa título, responsable, fecha inicio y fecha fin del subpunto anterior antes de agregar otro.'
                    : ''

                return (
                    <>
                        <button
                            type="button"
                            disabled={bloqueado}
                            onClick={addNode}
                            title={motivo || undefined}
                            style={{
                                alignSelf: 'flex-start',
                                fontSize: '12px',
                                color: bloqueado ? 'var(--fg3)' : 'var(--accent-hover)',
                                background: 'none',
                                border: '1px dashed var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '6px 12px',
                                cursor: bloqueado ? 'not-allowed' : 'pointer',
                                opacity: bloqueado ? 0.6 : 1,
                            }}
                        >
                            + Agregar subpunto {pathLabel ? `de ${pathLabel}` : ''}
                        </button>
                        {bloqueado && (
                            <p style={{ fontSize: '10px', color: 'var(--fg3)', margin: 0 }}>{motivo}</p>
                        )}
                    </>
                )
            })()}
        </div>
    )
}
