'use client'

import { createPortal } from 'react-dom'

type Props = {
    destinatario: string
    mensaje: string
    onChangeMensaje: (v: string) => void
    onConfirmar: (enviarCorreo: boolean) => void
    onCancelar: () => void
    enviando?: boolean
    // Genérico: por defecto trae el texto para "algo cambió al editar un
    // proyecto registrado", pero se puede sobreescribir para otros usos
    // (ej. avisar que el proyecto ya está listo para entrega).
    titulo?: string
    descripcion?: string
    labelOmitir?: string
    labelConfirmar?: string
}

// Se muestra cuando hay que decidir si avisarle o no al cliente por correo
// de algo (al editar un proyecto YA registrado cambió la fecha de entrega o
// el pago; o al marcar "Listo para Entrega"). Deja revisar/editar el
// mensaje antes de decidir si se manda o no.
export default function ConfirmarCorreoModal({
    destinatario,
    mensaje,
    onChangeMensaje,
    onConfirmar,
    onCancelar,
    enviando,
    titulo = 'Este cambio afecta la fecha de entrega o el pago',
    descripcion,
    labelOmitir = 'Guardar sin avisar',
    labelConfirmar = 'Guardar y avisar',
}: Props) {
    // Portal a <body>: mismo motivo que FirmaModal/AccountModal — un
    // position:fixed anidado dentro de una tarjeta con animación de entrada
    // puede quedar atrapado por la capa de composición de esa tarjeta.
    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(6, 14, 22, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                className="admin-content-card"
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxSizing: 'border-box',
                }}
            >
                <div>
                    <h3 style={{ fontFamily: 'var(--font-body)', margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {titulo}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', margin: 0, fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                        {descripcion ??
                            `¿Quieres avisarle al cliente (${destinatario || 'sin correo registrado'})? Puedes revisar o editar el mensaje antes de mandarlo.`}
                    </p>
                </div>

                <textarea
                    value={mensaje}
                    onChange={(e) => onChangeMensaje(e.target.value)}
                    rows={8}
                    className="admin-input"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'var(--font-body)',
                    }}
                />

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={enviando}
                        style={{
                            flex: '1 1 120px',
                            fontFamily: 'var(--font-body)',
                            border: '1px solid var(--admin-card-border)',
                            color: 'var(--admin-text-secondary)',
                            background: 'none',
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
                        onClick={() => onConfirmar(false)}
                        disabled={enviando}
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
                        {labelOmitir}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirmar(true)}
                        disabled={enviando || !destinatario}
                        style={{
                            flex: '1 1 120px',
                            fontFamily: 'var(--font-body)',
                            border: 'none',
                            color: '#fff',
                            background: 'var(--brand-orange)',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: destinatario ? 'pointer' : 'not-allowed',
                            fontSize: '13px',
                            fontWeight: 700,
                            opacity: enviando ? 0.6 : 1,
                        }}
                    >
                        {enviando ? 'Enviando...' : labelConfirmar}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}
