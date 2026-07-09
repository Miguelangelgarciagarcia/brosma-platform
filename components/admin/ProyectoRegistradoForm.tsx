'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SignatureCanvas from 'react-signature-canvas'
import FirmaModal from '@/components/FirmaModal'
import ConfirmarCorreoModal from '@/components/admin/ConfirmarCorreoModal'
import SubpointEditor, { SubpointNode, duracionDias, nodoCompleto } from '@/components/admin/SubpointEditor'
import { esPuntoSoloEstatus } from '@/lib/main-points'
import { calcularFechaEntregaSugerida, fechaMasTardiaDeSubpuntos } from '@/lib/business-days'
import { formatDate } from '@/lib/dates'

type MainPointState = {
    mainPointKey: string
    label: string
    responsibleId: string
    // Estatus real del punto principal en la BD. Si ya está "completado", no
    // se permite reasignar responsable desde aquí (mismo criterio que los
    // subpuntos individuales).
    status: string
    children: SubpointNode[]
}

function diasCalculados(children: SubpointNode[]): number {
    return children.reduce((sum, c) => sum + duracionDias(c.startDate, c.endDate), 0)
}

function validarSubpuntosCompletos(nodes: SubpointNode[], pathLabel: string): string | null {
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const label = `${pathLabel}.${i + 1}`
        if (!nodoCompleto(n)) {
            const faltantes: string[] = []
            if (!n.title.trim()) faltantes.push('título')
            if (!n.responsibleId) faltantes.push('responsable')
            if (!n.startDate) faltantes.push('fecha de inicio')
            if (!n.endDate) faltantes.push('fecha de fin')
            return `Subpunto ${label}: falta ${faltantes.join(', ')}`
        }
        const errorHijos = validarSubpuntosCompletos(n.children, label)
        if (errorHijos) return errorHijos
    }
    return null
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--brand-panel-input)',
    border: '1px solid var(--brand-panel-border)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: 'var(--brand-panel-fg)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    transition: 'border-color 0.15s ease, background 0.15s ease',
}

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--brand-panel-fg2)',
    display: 'block',
    marginBottom: '4px',
}

const sectionStyle: React.CSSProperties = {
    background: 'var(--brand-panel-card)',
    border: '1px solid var(--brand-panel-border)',
    borderRadius: '10px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeNumeric(value: string): string {
    let v = value.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    return v
}

function sanitizePhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 15)
}

function limpiarSubpuntosParaEnvio(nodes: SubpointNode[]): any[] {
    return nodes.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description || undefined,
        responsibleId: n.responsibleId,
        startDate: n.startDate ? new Date(n.startDate).toISOString() : undefined,
        endDate: n.endDate ? new Date(n.endDate).toISOString() : undefined,
        children: n.children.length ? limpiarSubpuntosParaEnvio(n.children) : undefined,
    }))
}

export type ProyectoRegistradoFormInitialData = {
    title: string
    clientName: string
    company: string
    phone: string
    email: string
    cost: string
    advancePayment: string
    notes: string
    estimatedDeliveryManual: string
    entregaEfectiva: string // manual si existe, si no la auto — para comparar cambios
    clientCanSeeSubpoints: boolean
    clientSignature: string
    receiverSignature: string
    // title viene de la propia fase ya guardada del proyecto — este
    // formulario nunca se re-sincroniza con el catálogo configurable, solo
    // trabaja con lo que el proyecto ya tiene.
    mainPoints: { mainPointKey: string; title: string; responsibleId: string; status: string; children: SubpointNode[] }[]
}

type Props = {
    folio: string
    initial: ProyectoRegistradoFormInitialData
}

export default function ProyectoRegistradoForm({ folio, initial }: Props) {
    const router = useRouter()
    const clienteSigRef = useRef<SignatureCanvas>(null)
    const receptorSigRef = useRef<SignatureCanvas>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [trabajadores, setTrabajadores] = useState<{ id: string; name: string }[]>([])
    const [modal, setModal] = useState<{ mensaje: string; body: any } | null>(null)

    const [form, setForm] = useState({
        title: initial.title,
        clientName: initial.clientName,
        company: initial.company,
        phone: initial.phone,
        email: initial.email,
        cost: initial.cost,
        advancePayment: initial.advancePayment,
        notes: initial.notes,
        estimatedDeliveryManual: initial.estimatedDeliveryManual,
        clientCanSeeSubpoints: initial.clientCanSeeSubpoints,
    })

    // Siempre a partir de las propias fases ya guardadas del proyecto (nunca
    // del catálogo configurable vivo): un proyecto ya registrado no se ve
    // afectado si el catálogo cambia después.
    const [mainPoints, setMainPoints] = useState<MainPointState[]>(() =>
        initial.mainPoints.map((mp) => ({
            mainPointKey: mp.mainPointKey,
            label: mp.title,
            responsibleId: mp.responsibleId,
            status: mp.status,
            children: mp.children,
        }))
    )

    useEffect(() => {
        fetch('/api/usuarios')
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTrabajadores(data.filter((u: any) => u.role === 'trabajador'))
                }
            })
    }, [])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    function updateMainPoint(index: number, patch: Partial<MainPointState>) {
        setMainPoints((prev) => prev.map((mp, i) => (i === index ? { ...mp, ...patch } : mp)))
    }

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, phone: sanitizePhone(e.target.value) }))
    }

    function handleCostChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = sanitizeNumeric(e.target.value)
        setForm((prev) => {
            const costNum = parseFloat(v || '0')
            const advanceNum = parseFloat(prev.advancePayment || '0')
            const advancePayment = costNum <= 0 ? '' : advanceNum > costNum ? v : prev.advancePayment
            return { ...prev, cost: v, advancePayment }
        })
    }

    const costoValido = parseFloat(form.cost || '0') > 0

    function handleAdvanceChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = sanitizeNumeric(e.target.value)
        setForm((prev) => {
            const costNum = parseFloat(prev.cost || '0')
            const advanceNum = parseFloat(v || '0')
            const advancePayment = prev.cost && advanceNum > costNum ? prev.cost : v
            return { ...prev, advancePayment }
        })
    }

    const paymentStatus = useMemo(() => {
        const cost = parseFloat(form.cost || '0')
        const advance = parseFloat(form.advancePayment || '0')
        if (!form.advancePayment || advance <= 0) return 'pendiente'
        if (cost > 0 && advance >= cost) return 'pagado'
        return 'anticipo'
    }, [form.cost, form.advancePayment])

    const emailValido = useMemo(() => !form.email || EMAIL_REGEX.test(form.email), [form.email])

    const fechaSugerida = useMemo(() => {
        const puntosConTrabajo = mainPoints.filter((mp) => !esPuntoSoloEstatus(mp.mainPointKey))
        const maxima = fechaMasTardiaDeSubpuntos(puntosConTrabajo.flatMap((mp) => mp.children))
        if (maxima) return maxima
        const dias = puntosConTrabajo.map((mp) => diasCalculados(mp.children))
        return calcularFechaEntregaSugerida(dias)
    }, [mainPoints])

    async function enviarAlServidor(body: any) {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/proyectos/${folio}/editar-registrado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const json = await res.json()
            if (!res.ok) {
                if (Array.isArray(json?.issues) && json.issues.length > 0) {
                    const detalle = json.issues
                        .map((i: { path: string; message: string }) => `${i.path || '(general)'}: ${i.message}`)
                        .join(' | ')
                    throw new Error(`${json.error}: ${detalle}`)
                }
                throw new Error(json.error || 'Error al guardar')
            }
            if (json.emailError) alert(json.emailError)
            setModal(null)
            router.push(`/admin/proyecto/${folio}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setModal(null)
        } finally {
            setLoading(false)
        }
    }

    async function preparar() {
        setError('')
        try {
            if (!form.title.trim()) throw new Error('Falta la descripción breve del proyecto')
            if (!form.clientName.trim()) throw new Error('Falta el nombre del cliente')
            if (!form.company.trim()) throw new Error('Falta la empresa')
            if (!form.phone.trim()) throw new Error('Falta el teléfono')
            if (!form.email.trim()) throw new Error('Falta el correo')
            if (!EMAIL_REGEX.test(form.email)) throw new Error('El correo del cliente no tiene un formato válido')

            for (const mp of mainPoints) {
                if (esPuntoSoloEstatus(mp.mainPointKey)) continue
                if (!mp.responsibleId) throw new Error(`Falta asignar responsable en "${mp.label}"`)
                const errorSubpuntos = validarSubpuntosCompletos(mp.children, `${mainPoints.indexOf(mp) + 1}`)
                if (errorSubpuntos) throw new Error(`"${mp.label}" → ${errorSubpuntos}`)
                if (diasCalculados(mp.children) <= 0) {
                    throw new Error(`Falta agregar al menos un subpunto con fecha de inicio y fin en "${mp.label}"`)
                }
            }

            const clientDataUrl = (clienteSigRef as any)._dataUrl
            const clientSig = clientDataUrl !== undefined ? clientDataUrl : initial.clientSignature || ''
            const receiverDataUrl = (receptorSigRef as any)._dataUrl
            const receiverSig = receiverDataUrl !== undefined ? receiverDataUrl : initial.receiverSignature || ''

            const body = {
                recordStatus: 'registrado',
                title: form.title,
                clientName: form.clientName,
                company: form.company,
                phone: form.phone,
                email: form.email,
                cost: form.cost ? Number(form.cost) : undefined,
                advancePayment: form.advancePayment ? Number(form.advancePayment) : undefined,
                paymentStatus,
                notes: form.notes || undefined,
                clientSignature: clientSig || undefined,
                receiverSignature: receiverSig || undefined,
                estimatedDeliveryManual: form.estimatedDeliveryManual
                    ? new Date(form.estimatedDeliveryManual).toISOString()
                    : undefined,
                clientCanSeeSubpoints: form.clientCanSeeSubpoints,
                mainPoints: mainPoints.map((mp) => ({
                    mainPointKey: mp.mainPointKey,
                    title: mp.label,
                    responsibleId: mp.responsibleId || trabajadores[0]?.id || '',
                    estimatedDays: esPuntoSoloEstatus(mp.mainPointKey) ? 0 : diasCalculados(mp.children),
                    children: mp.children.length ? limpiarSubpuntosParaEnvio(mp.children) : undefined,
                })),
            }

            // ¿Cambió algo sensible? (fecha de entrega efectiva o datos de pago)
            const entregaNueva = form.estimatedDeliveryManual || fechaSugerida.toISOString().slice(0, 10)
            const cambioEntrega = entregaNueva !== initial.entregaEfectiva.slice(0, 10)
            const cambioPago =
                (initial.cost || '') !== form.cost ||
                (initial.advancePayment || '') !== form.advancePayment

            if (cambioEntrega || cambioPago) {
                const lineas: string[] = [`Hola ${form.clientName}, hay una actualización en tu proyecto "${form.title}":`, '']
                if (cambioEntrega) {
                    lineas.push(
                        `- Nueva fecha estimada de entrega: ${formatDate(new Date(entregaNueva + 'T00:00:00'))} (antes: ${
                            initial.entregaEfectiva ? formatDate(new Date(initial.entregaEfectiva)) : 'sin definir'
                        })`
                    )
                }
                if (cambioPago) {
                    const costoAntes = initial.cost || '0'
                    const costoNuevo = form.cost || '0'
                    const adelantoAntes = initial.advancePayment || '0'
                    const adelantoNuevo = form.advancePayment || '0'
                    if (costoAntes !== costoNuevo) {
                        lineas.push(`- Costo: $${costoNuevo} (antes: $${costoAntes})`)
                    }
                    if (adelantoAntes !== adelantoNuevo) {
                        lineas.push(`- Adelanto: $${adelantoNuevo} (antes: $${adelantoAntes})`)
                    }
                    lineas.push(`- Estatus de pago: ${paymentStatus}`)
                }
                lineas.push('', 'Cualquier duda, contáctanos.', '', 'Brosma')

                setModal({ mensaje: lineas.join('\n'), body })
                return
            }

            await enviarAlServidor({ ...body, notificarCliente: false })
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <div
                style={{
                    background: 'var(--brand-navy-deep)',
                    borderBottom: '1px solid var(--brand-panel-border)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-orange)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '0.1em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        GRUPO BROSMA
                    </div>
                </div>
                <Link
                    href={`/admin/proyecto/${folio}`}
                    style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', textDecoration: 'none' }}
                >
                    ← Volver
                </Link>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: '#ffffff', margin: 0 }}>
                    Editar proyecto {folio}
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-panel-fg3)', margin: 0 }}>
                    Este proyecto ya está registrado. Si cambias la fecha de entrega o los datos de pago, te
                    preguntaremos si quieres avisarle al cliente antes de guardar.
                </p>

                <section style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg2)' }}>
                        Datos generales
                    </h2>
                    <div>
                        <label style={labelStyle}>Descripción breve del proyecto *</label>
                        <input name="title" value={form.title} onChange={handleChange} className="brand-panel-input" style={inputStyle} />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg2)' }}>
                        Datos del cliente
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Nombre completo *</label>
                            <input name="clientName" value={form.clientName} onChange={handleChange} className="brand-panel-input" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Empresa *</label>
                            <input name="company" value={form.company} onChange={handleChange} className="brand-panel-input" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono *</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handlePhoneChange}
                                inputMode="numeric"
                                className="brand-panel-input"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Correo *</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className="brand-panel-input"
                                style={{ ...inputStyle, border: `1px solid ${emailValido ? 'var(--brand-panel-border)' : '#ff6b6b'}` }}
                            />
                            {!emailValido && (
                                <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '11px', margin: '4px 0 0' }}>
                                    Correo con formato inválido
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg2)' }}>
                        Datos financieros
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Costo</label>
                            <input
                                name="cost"
                                inputMode="decimal"
                                value={form.cost}
                                onChange={handleCostChange}
                                placeholder="0.00"
                                className="brand-panel-input"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Adelanto</label>
                            <input
                                name="advancePayment"
                                inputMode="decimal"
                                value={form.advancePayment}
                                onChange={handleAdvanceChange}
                                disabled={!costoValido}
                                placeholder={costoValido ? '0.00' : 'Primero coloca el costo'}
                                className="brand-panel-input"
                                style={{ ...inputStyle, opacity: costoValido ? 1 : 0.5, cursor: costoValido ? 'text' : 'not-allowed' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Estatus de pago</label>
                            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: 'transparent' }}>
                                <span
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        background:
                                            paymentStatus === 'pagado'
                                                ? 'rgba(2,39,58,0.35)'
                                                : paymentStatus === 'anticipo'
                                                ? 'rgba(244,123,48,0.15)'
                                                : 'rgba(255,255,255,0.06)',
                                        color:
                                            paymentStatus === 'pagado'
                                                ? '#ffffff'
                                                : paymentStatus === 'anticipo'
                                                ? 'var(--brand-orange)'
                                                : 'var(--brand-panel-fg3)',
                                    }}
                                >
                                    {paymentStatus === 'pagado' ? 'Pagado' : paymentStatus === 'anticipo' ? 'Anticipo' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Notas</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            className="brand-panel-input"
                            style={{ ...inputStyle, resize: 'vertical' as const }}
                        />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg2)' }}>
                        Puntos principales y fases
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', margin: 0 }}>
                        "Listo para Entrega" y "Entregado" se marcan desde el detalle del proyecto, no aquí.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {mainPoints.map((mp, index) => {
                            if (esPuntoSoloEstatus(mp.mainPointKey)) return null
                            const dias = diasCalculados(mp.children)
                            const mpBloqueado = mp.status === 'completado'
                            return (
                                <div
                                    key={mp.mainPointKey}
                                    style={{
                                        border: '1px solid var(--brand-panel-border)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: 'var(--brand-panel-fg)',
                                        }}
                                    >
                                        {index + 1}. {mp.label}
                                        {mpBloqueado && (
                                            <span
                                                style={{
                                                    fontFamily: 'var(--font-body)',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    color: 'var(--brand-orange)',
                                                    background: 'rgba(244,123,48,0.15)',
                                                    borderRadius: '999px',
                                                    padding: '2px 8px',
                                                }}
                                            >
                                                ✓ Completado
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <select
                                            value={mp.responsibleId}
                                            disabled={mpBloqueado}
                                            onChange={(e) => updateMainPoint(index, { responsibleId: e.target.value })}
                                            className="brand-panel-input"
                                            style={{ ...inputStyle, opacity: mpBloqueado ? 0.6 : 1 }}
                                        >
                                            <option value="">Responsable...</option>
                                            {trabajadores.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div
                                            style={{
                                                ...inputStyle,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'transparent',
                                                color: 'var(--brand-panel-fg2)',
                                            }}
                                        >
                                            <span>Días estimados</span>
                                            <strong style={{ color: 'var(--brand-panel-fg)' }}>{dias}</strong>
                                        </div>
                                    </div>

                                    <SubpointEditor
                                        nodes={mp.children}
                                        onChange={(children) => updateMainPoint(index, { children })}
                                        trabajadores={trabajadores}
                                        depth={1}
                                        pathLabel={`${index + 1}`}
                                        defaultColapsado
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--brand-panel-fg2)',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={form.clientCanSeeSubpoints}
                            onChange={(e) => setForm((prev) => ({ ...prev, clientCanSeeSubpoints: e.target.checked }))}
                        />
                        El cliente puede ver el primer nivel de subpuntos (1.1, 1.2...) en su seguimiento
                    </label>

                    <div
                        style={{
                            background: 'rgba(244,123,48,0.08)',
                            border: '1px solid var(--brand-panel-border)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                        }}
                    >
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-panel-fg)' }}>
                            Entrega sugerida: <strong>{fechaSugerida.toLocaleDateString('es-MX')}</strong>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Fecha de entrega (ajuste manual, opcional)</label>
                        <input
                            type="date"
                            name="estimatedDeliveryManual"
                            value={form.estimatedDeliveryManual}
                            onChange={handleChange}
                            className="brand-panel-input"
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                        />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg2)' }}>
                        Firmas
                    </h2>
                    <FirmaModal label="Firma del cliente" firmaRef={clienteSigRef} initialDataUrl={initial.clientSignature || undefined} />
                    <FirmaModal label="Firma de quien recibe" firmaRef={receptorSigRef} initialDataUrl={initial.receiverSignature || undefined} />
                </section>

                {error && <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

                <button
                    type="button"
                    disabled={loading}
                    onClick={preparar}
                    style={{
                        background: 'var(--brand-orange)',
                        border: 'none',
                        color: '#fff',
                        fontFamily: 'var(--font-body)',
                        padding: '14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                        opacity: loading ? 0.6 : 1,
                        marginBottom: '32px',
                    }}
                >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            {modal && (
                <ConfirmarCorreoModal
                    destinatario={form.email}
                    mensaje={modal.mensaje}
                    onChangeMensaje={(v) => setModal((m) => (m ? { ...m, mensaje: v } : m))}
                    onCancelar={() => setModal(null)}
                    enviando={loading}
                    onConfirmar={(enviarCorreo) =>
                        enviarAlServidor({ ...modal.body, notificarCliente: enviarCorreo, mensajeCorreo: modal.mensaje })
                    }
                />
            )}
        </main>
    )
}
