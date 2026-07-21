'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'

type Props = {
    folio: string
    title: string
}

// Botón + modal de confirmación para borrar un proyecto por completo
// (borrador o ya registrado). Es la acción más destructiva del panel: se
// lleva las fases, subpuntos y todo el historial con él, sin posibilidad de
// deshacer — por eso pide una confirmación explícita en un modal aparte en
// vez de un simple window.confirm(), siguiendo el mismo patrón de portal a
// <body> que el resto de los modales (evita quedar atrapado detrás de
// tarjetas con animación).
export default function EliminarProyectoButton({ folio, title }: Props) {
    const router = useRouter()
    const [abierto, setAbierto] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [error, setError] = useState('')

    async function confirmar() {
        setEliminando(true)
        setError('')
        try {
            const res = await fetch(`/api/proyectos/${folio}`, { method: 'DELETE' })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'No se pudo eliminar el proyecto')
            router.push('/admin')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setEliminando(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setAbierto(true)}
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    border: '1px solid var(--admin-topbar-border)',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    background: 'transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                Eliminar proyecto
            </button>

            {abierto &&
                createPortal(
                    <div
                        onClick={() => !eliminando && setAbierto(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(6, 14, 22, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            zIndex: 9999,
                            animation: 'brandFadeIn 0.2s ease both',
                        }}
                    >
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            aria-label="Eliminar proyecto"
                            onClick={(e) => e.stopPropagation()}
                            className="admin-content-card"
                            style={{
                                width: '100%',
                                maxWidth: '440px',
                                padding: '24px',
                                animation: 'brandFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'var(--admin-icon-red-bg)',
                                        color: 'var(--admin-icon-red-fg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        fontSize: '20px',
                                    }}
                                >
                                    ⚠
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                                        Eliminar proyecto
                                    </h2>
                                    <p
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '12px',
                                            color: 'var(--admin-text-secondary)',
                                            margin: '2px 0 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {folio} · {title}
                                    </p>
                                </div>
                            </div>

                            <p
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '13px',
                                    color: 'var(--admin-text-primary)',
                                    lineHeight: 1.5,
                                    margin: '16px 0 0',
                                }}
                            >
                                Esta acción eliminará el proyecto <strong>{folio}</strong> de forma permanente, junto
                                con todas sus fases, subpuntos y su historial completo — sea borrador o ya esté
                                registrado. No se puede deshacer.
                            </p>

                            {error && (
                                <p
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        color: 'var(--admin-icon-red-fg)',
                                        background: 'var(--admin-icon-red-bg)',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        fontSize: '13px',
                                        margin: '14px 0 0',
                                    }}
                                >
                                    {error}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setAbierto(false)}
                                    disabled={eliminando}
                                    style={{
                                        flex: '1 1 120px',
                                        fontFamily: 'var(--font-body)',
                                        border: '1px solid var(--admin-card-border)',
                                        color: 'var(--admin-text-primary)',
                                        background: '#ffffff',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmar}
                                    disabled={eliminando}
                                    style={{
                                        flex: '1 1 120px',
                                        fontFamily: 'var(--font-body)',
                                        border: 'none',
                                        color: '#fff',
                                        background: 'var(--admin-icon-red-fg)',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        opacity: eliminando ? 0.6 : 1,
                                    }}
                                >
                                    {eliminando ? 'Eliminando...' : 'Sí, eliminar proyecto'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    )
}
