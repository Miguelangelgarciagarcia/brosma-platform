'use client'

import { useState } from 'react'
import ProyectoAccordion from '@/components/trabajo/ProyectoAccordion'

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

type Props = {
    pendientes: Grupo[]
    completados: Grupo[]
    totalPendientes: number
    totalCompletados: number
}

export default function PendientesFinalizadosTabs({ pendientes, completados, totalPendientes, totalCompletados }: Props) {
    const [tab, setTab] = useState<'pendientes' | 'finalizados'>('pendientes')

    const grupos = tab === 'pendientes' ? pendientes : completados

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    gap: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    marginBottom: '14px',
                }}
            >
                <button
                    type="button"
                    onClick={() => setTab('pendientes')}
                    style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'pendientes' ? 'var(--accent)' : 'none',
                        color: tab === 'pendientes' ? '#fff' : 'var(--fg2)',
                    }}
                >
                    Pendientes ({totalPendientes})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('finalizados')}
                    style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'finalizados' ? 'var(--accent)' : 'none',
                        color: tab === 'finalizados' ? '#fff' : 'var(--fg2)',
                    }}
                >
                    Finalizados ({totalCompletados})
                </button>
            </div>

            {grupos.length === 0 ? (
                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--fg3)',
                        fontSize: '13px',
                    }}
                >
                    {tab === 'pendientes' ? 'No tienes puntos pendientes por ahora.' : 'Todavía no terminas ningún punto.'}
                </div>
            ) : (
                <ProyectoAccordion grupos={grupos} />
            )}
        </div>
    )
}
