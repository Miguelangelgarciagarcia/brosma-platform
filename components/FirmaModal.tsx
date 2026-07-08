'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
    label: string
    firmaRef: React.RefObject<SignatureCanvas | null>
}

export default function FirmaModal({ label, firmaRef }: Props) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [firmada, setFirmada] = useState(false)
    const modalSigRef = useRef<SignatureCanvas>(null)

    function abrirModal() {
        setModalAbierto(true)
    }

    function limpiar() {
        modalSigRef.current?.clear()
    }

    function confirmar() {
        if (modalSigRef.current?.isEmpty()) return

        const dataUrl = modalSigRef.current?.toDataURL()
        if (dataUrl && firmaRef.current) {
            const img = new Image()
            img.src = dataUrl
            img.onload = () => {
                const canvas = firmaRef.current?.getCanvas()
                if (canvas) {
                    const ctx = canvas.getContext('2d')
                    ctx?.clearRect(0, 0, canvas.width, canvas.height)
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
                }
            }
            ;(firmaRef as any)._dataUrl = dataUrl
        }

        setFirmada(true)
        setModalAbierto(false)
    }

    function limpiarFirma() {
        firmaRef.current?.clear()
        ;(firmaRef as any)._dataUrl = null
        setFirmada(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--fg2)' }}>{label}</label>

            <div
                onClick={abrirModal}
                style={{
                    border: firmada ? '1px solid var(--accent)' : '1px dashed var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: firmada ? 'rgba(47,111,237,0.08)' : 'var(--bg-input)',
                    color: firmada ? 'var(--accent-hover)' : 'var(--fg3)',
                    fontSize: '13px',
                    gap: '8px',
                }}
            >
                {firmada ? '✅ Firma capturada' : '✍️ Toca aquí para firmar'}
            </div>

            {firmada && (
                <button
                    type="button"
                    onClick={limpiarFirma}
                    style={{ fontSize: '11px', color: '#e0503a', background: 'none', border: 'none', alignSelf: 'flex-end', cursor: 'pointer' }}
                >
                    Eliminar firma
                </button>
            )}

            <div style={{ display: 'none' }}>
                <SignatureCanvas ref={firmaRef} canvasProps={{ width: 600, height: 150 }} backgroundColor="white" />
            </div>

            {modalAbierto && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '480px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#111', fontSize: '15px', fontWeight: 600 }}>{label}</h3>
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ border: '2px solid #eee', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                            <SignatureCanvas
                                ref={modalSigRef}
                                canvasProps={{ width: 440, height: 200, style: { width: '100%', touchAction: 'none' } }}
                                backgroundColor="white"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={limpiar}
                                style={{ flex: 1, border: '1px solid #ccc', color: '#555', background: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Limpiar
                            </button>
                            <button
                                type="button"
                                onClick={confirmar}
                                style={{ flex: 1, border: 'none', color: '#fff', background: '#111', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Confirmar ✓
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
