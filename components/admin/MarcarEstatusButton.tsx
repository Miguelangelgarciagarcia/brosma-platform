'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmarCorreoModal from '@/components/admin/ConfirmarCorreoModal'

type Props = {
    phaseId: string
    // Solo "Listo para Entrega" ofrece avisarle al cliente por correo (es
    // opcional). El resto de los puntos se marcan completados directo, sin
    // preguntar nada.
    mainPointKey?: string | null
    proyecto?: {
        folio: string
        title: string
        clientName: string
        email: string | null
    }
}

export default function MarcarEstatusButton({ phaseId, mainPointKey, proyecto }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [modal, setModal] = useState<{ mensaje: string } | null>(null)

    const ofreceAvisoCliente = mainPointKey === 'listo_entrega' && !!proyecto

    async function marcar(notificarCliente?: boolean, mensajeCorreo?: string) {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/fases/${phaseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completado', notificarCliente, mensajeCorreo }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al actualizar')
            if (json.emailError) alert(json.emailError)
            setModal(null)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setModal(null)
        } finally {
            setLoading(false)
        }
    }

    function abrirConfirmacion() {
        if (!proyecto) return
        const lineas = [
            `Hola ${proyecto.clientName}, tu proyecto "${proyecto.title}" (folio ${proyecto.folio}) ya está listo para entrega.`,
            '',
            'Cualquier duda, contáctanos.',
            '',
            'Brosma',
        ]
        setModal({ mensaje: lineas.join('\n') })
    }

    function onClick() {
        if (ofreceAvisoCliente) {
            abrirConfirmacion()
        } else {
            marcar()
        }
    }

    return (
        <div style={{ marginTop: '6px' }}>
            <button
                type="button"
                disabled={loading}
                onClick={onClick}
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--brand-orange)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? 'Guardando...' : 'Marcar como completado'}
            </button>
            {error && <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '11px', margin: '4px 0 0' }}>{error}</p>}

            {modal && proyecto && (
                <ConfirmarCorreoModal
                    titulo="Proyecto listo para entrega"
                    descripcion={`¿Quieres avisarle al cliente (${proyecto.email || 'sin correo registrado'}) que su proyecto ya está listo para entrega? Es opcional, y puedes revisar o editar el mensaje antes de mandarlo.`}
                    destinatario={proyecto.email || ''}
                    mensaje={modal.mensaje}
                    onChangeMensaje={(v) => setModal({ mensaje: v })}
                    onCancelar={() => setModal(null)}
                    enviando={loading}
                    labelOmitir="Marcar sin avisar"
                    labelConfirmar="Marcar y avisar"
                    onConfirmar={(enviarCorreo) => marcar(enviarCorreo, modal.mensaje)}
                />
            )}
        </div>
    )
}
