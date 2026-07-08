'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import FirmaModal from '@/components/FirmaModal'
import SubpointEditor, { SubpointNode, nuevoSubpunto } from '@/components/admin/SubpointEditor'
import { MAIN_POINTS, esPuntoSoloEstatus } from '@/lib/main-points'
import { calcularFechaEntregaSugerida } from '@/lib/business-days'

type MainPointState = {
    mainPointKey: string
    label: string
    responsibleId: string
    estimatedDays: string
    children: SubpointNode[]
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    color: 'var(--fg1)',
    fontSize: '13px',
}

const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--fg2)',
    display: 'block',
    marginBottom: '4px',
}

const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

function limpiarSubpuntosParaEnvio(nodes: SubpointNode[]): any[] {
    return nodes.map((n) => ({
        title: n.title,
        description: n.description || undefined,
        responsibleId: n.responsibleId,
        startDate: n.startDate ? new Date(n.startDate).toISOString() : undefined,
        endDate: n.endDate ? new Date(n.endDate).toISOString() : undefined,
        children: n.children.length ? limpiarSubpuntosParaEnvio(n.children) : undefined,
    }))
}

export default function NuevoProyectoPage() {
    const router = useRouter()
    const clienteSigRef = useRef<SignatureCanvas>(null)
    const receptorSigRef = useRef<SignatureCanvas>(null)

    const [loading, setLoading] = useState<'borrador' | 'registrado' | null>(null)
    const [error, setError] = useState('')
    const [trabajadores, setTrabajadores] = useState<{ id: string; name: string }[]>([])

    const [form, setForm] = useState({
        title: '',
        clientName: '',
        company: '',
        phone: '',
        email: '',
        cost: '',
        advancePayment: '',
        paymentStatus: 'pendiente',
        notes: '',
        estimatedDeliveryManual: '',
        clientCanSeeSubpoints: false,
    })

    const [mainPoints, setMainPoints] = useState<MainPointState[]>(
        MAIN_POINTS.map((p) => ({
            mainPointKey: p.key,
            label: p.label,
            responsibleId: '',
            estimatedDays: '',
            children: [],
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

    const fechaSugerida = useMemo(() => {
        const dias = mainPoints
            .filter((mp) => !esPuntoSoloEstatus(mp.mainPointKey))
            .map((mp) => parseInt(mp.estimatedDays || '0', 10))
        return calcularFechaEntregaSugerida(dias)
    }, [mainPoints])

    async function enviar(recordStatus: 'borrador' | 'registrado') {
        setLoading(recordStatus)
        setError('')

        try {
            if (recordStatus === 'registrado') {
                for (const mp of mainPoints) {
                    if (esPuntoSoloEstatus(mp.mainPointKey)) continue
                    if (!mp.responsibleId) {
                        throw new Error(`Falta asignar responsable en "${mp.label}"`)
                    }
                    if (!mp.estimatedDays) {
                        throw new Error(`Falta días estimados en "${mp.label}"`)
                    }
                }
            }

            const clientSig =
                (clienteSigRef as any)._dataUrl ||
                (clienteSigRef.current?.isEmpty() ? '' : clienteSigRef.current?.toDataURL() || '')
            const receiverSig =
                (receptorSigRef as any)._dataUrl ||
                (receptorSigRef.current?.isEmpty() ? '' : receptorSigRef.current?.toDataURL() || '')

            const body = {
                recordStatus,
                title: form.title,
                clientName: form.clientName,
                company: form.company || undefined,
                phone: form.phone,
                email: form.email || undefined,
                cost: form.cost ? Number(form.cost) : undefined,
                advancePayment: form.advancePayment ? Number(form.advancePayment) : undefined,
                paymentStatus: form.paymentStatus,
                notes: form.notes || undefined,
                clientSignature: clientSig || undefined,
                receiverSignature: receiverSig || undefined,
                estimatedDeliveryManual: form.estimatedDeliveryManual
                    ? new Date(form.estimatedDeliveryManual).toISOString()
                    : undefined,
                clientCanSeeSubpoints: form.clientCanSeeSubpoints,
                mainPoints: mainPoints.map((mp) => ({
                    mainPointKey: mp.mainPointKey,
                    responsibleId: mp.responsibleId || trabajadores[0]?.id || '',
                    estimatedDays: mp.estimatedDays ? Number(mp.estimatedDays) : 0,
                    children: mp.children.length ? limpiarSubpuntosParaEnvio(mp.children) : undefined,
                })),
            }

            const res = await fetch('/api/proyectos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al guardar')

            if (json.emailError) {
                alert(json.emailError)
            }

            router.push('/admin')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <main style={{ minHeight: '100vh' }}>
            <div
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '16px' }}>Brosma</div>
                <a href="/admin" style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                    ← Volver
                </a>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Nuevo proyecto</h1>

                <section style={sectionStyle}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--fg2)' }}>Datos generales</h2>
                    <div>
                        <label style={labelStyle}>Descripción breve del proyecto *</label>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="Molde para tapa de envase 500ml" style={inputStyle} />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--fg2)' }}>Datos del cliente</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Nombre completo *</label>
                            <input name="clientName" value={form.clientName} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Empresa</label>
                            <input name="company" value={form.company} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono *</label>
                            <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Correo</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--fg2)' }}>Datos financieros</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Costo</label>
                            <input name="cost" type="number" value={form.cost} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Adelanto</label>
                            <input name="advancePayment" type="number" value={form.advancePayment} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Estatus de pago</label>
                            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange} style={inputStyle}>
                                <option value="pendiente">Pendiente</option>
                                <option value="anticipo">Anticipo</option>
                                <option value="pagado">Pagado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Notas</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--fg2)' }}>Puntos principales y fases</h2>
                        <span style={{ fontSize: '11px', color: 'var(--accent-hover)' }}>
                            Entrega sugerida: {fechaSugerida.toLocaleDateString('es-MX')}
                        </span>
                    </div>

                    {trabajadores.length === 0 && (
                        <p style={{ fontSize: '12px', color: '#e0a020', margin: 0 }}>
                            No hay trabajadores dados de alta todavía. Necesitas al menos uno para asignar responsables
                            (créalo directo en la base de datos por ahora; el módulo de alta de usuarios llega en la Fase 6).
                        </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {mainPoints.map((mp, index) => {
                            const soloEstatus = esPuntoSoloEstatus(mp.mainPointKey)
                            return (
                                <div
                                    key={mp.mainPointKey}
                                    style={{
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                        {index + 1}. {mp.label}
                                    </div>

                                    {soloEstatus ? (
                                        <p style={{ fontSize: '12px', color: 'var(--fg3)', margin: 0 }}>
                                            Bandera de estatus: se marca directamente desde el panel cuando el
                                            proyecto llegue a esta etapa. No requiere responsable ni días.
                                        </p>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <select
                                                    value={mp.responsibleId}
                                                    onChange={(e) => updateMainPoint(index, { responsibleId: e.target.value })}
                                                    style={inputStyle}
                                                >
                                                    <option value="">Responsable...</option>
                                                    {trabajadores.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Días estimados"
                                                    value={mp.estimatedDays}
                                                    onChange={(e) => updateMainPoint(index, { estimatedDays: e.target.value })}
                                                    style={inputStyle}
                                                />
                                            </div>

                                            <SubpointEditor
                                                nodes={mp.children}
                                                onChange={(children) => updateMainPoint(index, { children })}
                                                trabajadores={trabajadores}
                                                depth={1}
                                                pathLabel={`${index + 1}`}
                                            />
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--fg2)' }}>
                        <input
                            type="checkbox"
                            checked={form.clientCanSeeSubpoints}
                            onChange={(e) => setForm((prev) => ({ ...prev, clientCanSeeSubpoints: e.target.checked }))}
                        />
                        El cliente puede ver el primer nivel de subpuntos (1.1, 1.2...) en su seguimiento
                    </label>

                    <div>
                        <label style={labelStyle}>Fecha de entrega (ajuste manual, opcional)</label>
                        <input
                            type="date"
                            name="estimatedDeliveryManual"
                            value={form.estimatedDeliveryManual}
                            onChange={handleChange}
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                        />
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--fg2)' }}>Firmas</h2>
                    <FirmaModal label="Firma del cliente" firmaRef={clienteSigRef} />
                    <FirmaModal label="Firma de quien recibe" firmaRef={receptorSigRef} />
                </section>

                {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
                    <button
                        type="button"
                        disabled={loading !== null}
                        onClick={() => enviar('borrador')}
                        style={{
                            flex: 1,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--fg1)',
                            padding: '14px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading === 'borrador' ? 'Guardando...' : 'Guardar para seguir editando'}
                    </button>
                    <button
                        type="button"
                        disabled={loading !== null}
                        onClick={() => enviar('registrado')}
                        style={{
                            flex: 1,
                            background: 'var(--accent)',
                            border: 'none',
                            color: '#fff',
                            padding: '14px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '13px',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading === 'registrado' ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
            </div>
        </main>
    )
}
