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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '480px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700 }}>{titulo}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--fg2)' }}>
                        {descripcion ??
                            `¿Quieres avisarle al cliente (${destinatario || 'sin correo registrado'})? Puedes revisar o editar el mensaje antes de mandarlo.`}
                    </p>
                </div>

                <textarea
                    value={mensaje}
                    onChange={(e) => onChangeMensaje(e.target.value)}
                    rows={8}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        color: 'var(--fg1)',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                    }}
                />

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={enviando}
                        style={{
                            flex: 1,
                            border: '1px solid var(--border-default)',
                            color: 'var(--fg2)',
                            background: 'none',
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
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
                            flex: 1,
                            border: '1px solid var(--border-default)',
                            color: 'var(--fg1)',
                            background: 'var(--bg-input)',
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
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
                            flex: 1,
                            border: 'none',
                            color: '#fff',
                            background: 'var(--accent)',
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: destinatario ? 'pointer' : 'not-allowed',
                            fontSize: '13px',
                            fontWeight: 600,
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
