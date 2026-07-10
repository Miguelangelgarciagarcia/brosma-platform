'use client'

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
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 60,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                style={{
                    background: 'var(--brand-panel-card)',
                    border: '1px solid var(--brand-panel-border)',
                    borderRadius: '16px',
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
                    <h3 style={{ fontFamily: 'var(--font-body)', margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--brand-panel-fg)' }}>
                        {titulo}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', margin: 0, fontSize: '12px', color: 'var(--brand-panel-fg2)' }}>
                        {descripcion ??
                            `¿Quieres avisarle al cliente (${destinatario || 'sin correo registrado'})? Puedes revisar o editar el mensaje antes de mandarlo.`}
                    </p>
                </div>

                <textarea
                    value={mensaje}
                    onChange={(e) => onChangeMensaje(e.target.value)}
                    rows={8}
                    className="brand-panel-input"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'var(--brand-panel-input)',
                        border: '1px solid var(--brand-panel-border)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'var(--brand-panel-fg)',
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
                            border: '1px solid var(--brand-panel-border)',
                            color: 'var(--brand-panel-fg2)',
                            background: 'none',
                            padding: '10px',
                            borderRadius: '6px',
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
                            border: '1px solid var(--brand-panel-border)',
                            color: 'var(--brand-panel-fg)',
                            background: 'var(--brand-panel-input)',
                            padding: '10px',
                            borderRadius: '6px',
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
                            borderRadius: '6px',
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
        </div>
    )
}
