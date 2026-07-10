'use client'

import { useState } from 'react'
import ProyectoAccordion from '@/components/trabajo/ProyectoAccordion'
import AmiCargoList from '@/components/trabajo/AmiCargoList'

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

type SubpuntoACargo = { id: string; label: string; title: string; status: string; responsableName: string; atrasado: boolean }
type PuntoACargo = { id: string; label: string; title: string; status: string; atrasado: boolean; subpuntos: SubpuntoACargo[] }
type GrupoACargo = { folio: string; title: string; clientName: string; puntos: PuntoACargo[] }

type Props = {
    pendientes: Grupo[]
    completados: Grupo[]
    totalPendientes: number
    totalCompletados: number
    // Puntos principales de los que el usuario es encargado (solo lectura).
    aCargo: GrupoACargo[]
    totalACargo: number
}

export default function PendientesFinalizadosTabs({
    pendientes,
    completados,
    totalPendientes,
    totalCompletados,
    aCargo,
    totalACargo,
}: Props) {
    const [tab, setTab] = useState<'pendientes' | 'finalizados' | 'a_cargo'>('pendientes')

    const grupos = tab === 'pendientes' ? pendientes : tab === 'finalizados' ? completados : null

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
                    flexWrap: 'wrap',
                }}
            >
                <button
                    type="button"
                    onClick={() => setTab('pendientes')}
                    style={{
                        flex: 1,
                        minWidth: '90px',
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
                        minWidth: '90px',
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
                <button
                    type="button"
                    onClick={() => setTab('a_cargo')}
                    style={{
                        flex: 1,
                        minWidth: '90px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'a_cargo' ? 'var(--brand-orange)' : 'none',
                        color: tab === 'a_cargo' ? '#fff' : 'var(--brand-panel-fg2)',
                    }}
                >
                    A mi cargo ({totalACargo})
                </button>
            </div>

            {tab === 'a_cargo' ? (
                <AmiCargoList grupos={aCargo} />
            ) : grupos && grupos.length === 0 ? (
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
                grupos && <ProyectoAccordion grupos={grupos} />
            )}
        </div>
    )
}
