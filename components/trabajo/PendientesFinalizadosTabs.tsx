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
                    background: 'var(--brand-panel-input)',
                    border: '1px solid var(--brand-panel-border)',
                    borderRadius: '10px',
                    padding: '4px',
                    marginBottom: '14px',
                }}
            >
                <button
                    type="button"
                    onClick={() => setTab('pendientes')}
                    style={{
                        flex: 1,
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'pendientes' ? 'var(--brand-orange)' : 'none',
                        color: tab === 'pendientes' ? '#fff' : 'var(--brand-panel-fg2)',
                    }}
                >
                    Pendientes ({totalPendientes})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('finalizados')}
                    style={{
                        flex: 1,
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'finalizados' ? 'var(--brand-orange)' : 'none',
                        color: tab === 'finalizados' ? '#fff' : 'var(--brand-panel-fg2)',
                    }}
                >
                    Finalizados ({totalCompletados})
                </button>
            </div>

            {grupos.length === 0 ? (
                <div
                    style={{
                        background: 'var(--brand-panel-card)',
                        border: '1px solid var(--brand-panel-border)',
                        borderRadius: '10px',
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--brand-panel-fg3)',
                        fontFamily: 'var(--font-body)',
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
