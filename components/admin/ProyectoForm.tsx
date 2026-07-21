'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import SignatureCanvas from 'react-signature-canvas'
import FirmaModal from '@/components/FirmaModal'
import SubpointEditor, { SubpointNode, nuevoSubpunto, duracionDias, nodoCompleto } from '@/components/admin/SubpointEditor'
import CargarModeloModal from '@/components/admin/CargarModeloModal'
import { esPuntoSoloEstatus, CatalogoPunto } from '@/lib/main-points'
import { calcularFechaEntregaSugerida, fechaMasTardiaDeSubpuntos } from '@/lib/business-days'
import { hoyUTC } from '@/lib/dates'

// Estructura que devuelve GET /api/proyectos/[folio]/modelo: un punto
// principal identificado por su TEXTO (no por mainPointKey ni posición: el
// key es un snapshot que se pierde si el punto se borra y se vuelve a
// crear en el catálogo, aunque se llame igual), con su encargado y el
// árbol completo de subpuntos ya en formato de <input type="date">
// (string "YYYY-MM-DD").
type NodoModelo = {
    title: string
    description: string
    responsibleId: string
    startDate: string
    endDate: string
    children: NodoModelo[]
}
type MainPointModelo = { title: string; responsibleId: string; children: NodoModelo[] }

// Normaliza texto para comparar puntos principales por nombre sin que
// falle por mayúsculas, acentos o espacios de más (ej. "Compras" vs
// "compras " vs "COMPRAS" deben matchear igual).
function normalizarTexto(t: string): string {
    return t
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

// Todas las fechas se guardan como medianoche UTC del día elegido (mismo
// criterio que lib/dates.ts): se parsean/reconstruyen siempre en UTC para
// no correr un día por el huso horario del navegador.
function parseFechaUTC(f: string): number {
    return new Date(f + 'T00:00:00Z').getTime()
}
function formatFechaUTC(t: number): string {
    return new Date(t).toISOString().slice(0, 10)
}

// Clona el árbol de un modelo hacia nodos SubpointNode nuevos (clientId
// fresco, sin id/status: se tratan como subpuntos nuevos de este proyecto),
// recorriendo todas sus fechas por el mismo desfase para que el subpunto
// más temprano de TODO el modelo arranque hoy, conservando el espaciado
// relativo entre los demás.
function clonarNodosModelo(nodes: NodoModelo[], shiftMs: number): SubpointNode[] {
    return nodes.map((n) => ({
        clientId: Math.random().toString(36).slice(2),
        id: undefined,
        status: undefined,
        title: n.title,
        description: n.description,
        responsibleId: n.responsibleId,
        startDate: n.startDate ? formatFechaUTC(parseFechaUTC(n.startDate) + shiftMs) : '',
        endDate: n.endDate ? formatFechaUTC(parseFechaUTC(n.endDate) + shiftMs) : '',
        children: clonarNodosModelo(n.children, shiftMs),
    }))
}

type MainPointState = {
    mainPointKey: string
    label: string
    responsibleId: string
    children: SubpointNode[]
}

// Los días estimados de un punto principal ya no se escriben a mano: se
// derivan de la suma de la duración (en días naturales) de sus subpuntos
// de primer nivel (1.1, 1.2, ...). Los sub-subpuntos son solo desglose
// interno de esos rangos, no suman aparte.
function diasCalculados(children: SubpointNode[]): number {
    return children.reduce((sum, c) => sum + duracionDias(c.startDate, c.endDate), 0)
}

// Cualquier subpunto que ya exista (a cualquier profundidad) debe traer
// título, responsable, fecha de inicio y fecha de fin completos, tanto para
// guardar como borrador como para registrar — no se permite dejar uno a
// medias colgado en el árbol.
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
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
}

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--admin-text-secondary)',
    display: 'block',
    marginBottom: '4px',
}

const sectionStyle: React.CSSProperties = {
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Deja solo dígitos y, como mucho, un punto decimal (nada de $, comas, letras, etc.)
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
        title: n.title,
        description: n.description || undefined,
        responsibleId: n.responsibleId,
        startDate: n.startDate ? new Date(n.startDate).toISOString() : undefined,
        endDate: n.endDate ? new Date(n.endDate).toISOString() : undefined,
        children: n.children.length ? limpiarSubpuntosParaEnvio(n.children) : undefined,
    }))
}

export type ProyectoFormInitialData = {
    title: string
    clientName: string
    company: string
    phone: string
    email: string
    cost: string
    advancePayment: string
    notes: string
    estimatedDeliveryManual: string
    clientCanSeeSubpoints: boolean
    clientSignature: string
    receiverSignature: string
    // Título propio ya guardado en la fase (viene de las propias Phase del
    // borrador, nunca del catálogo vivo — un borrador nunca se re-sincroniza
    // con cambios posteriores del catálogo).
    mainPoints: { mainPointKey: string; title: string; responsibleId: string; children: SubpointNode[] }[]
}

type Props = {
    mode: 'crear' | 'editar'
    folio?: string
    initial?: ProyectoFormInitialData
    // Solo se usa en modo "crear": catálogo de puntos activos + los 2 fijos,
    // recién leído de la base de datos por el Server Component que renderiza
    // esta pantalla. Es una plantilla que solo se copia una vez, al crear.
    catalogoPuntos?: CatalogoPunto[]
    // Para el header compartido del panel (mismo <AdminHeader/> que
    // Dashboard/Historial/Configuración) — así "Registrar"/editar un
    // borrador se siente parte de la misma pantalla en vez de un salto a
    // otra página con un diseño distinto.
    userName?: string | null
    userEmail?: string | null
    userRole?: string | null
}

export default function ProyectoForm({ mode, folio, initial, catalogoPuntos, userName, userEmail, userRole }: Props) {
    const router = useRouter()
    const clienteSigRef = useRef<SignatureCanvas>(null)
    const receptorSigRef = useRef<SignatureCanvas>(null)

    const [loading, setLoading] = useState<'borrador' | 'registrado' | null>(null)
    const [error, setError] = useState('')
    const [trabajadores, setTrabajadores] = useState<{ id: string; name: string }[]>([])
    const [modeloAbierto, setModeloAbierto] = useState(false)
    const [cargandoModelo, setCargandoModelo] = useState(false)

    const [form, setForm] = useState({
        title: initial?.title ?? '',
        clientName: initial?.clientName ?? '',
        company: initial?.company ?? '',
        phone: initial?.phone ?? '',
        email: initial?.email ?? '',
        cost: initial?.cost ?? '',
        advancePayment: initial?.advancePayment ?? '',
        notes: initial?.notes ?? '',
        estimatedDeliveryManual: initial?.estimatedDeliveryManual ?? '',
        clientCanSeeSubpoints: initial?.clientCanSeeSubpoints ?? false,
    })

    const [mainPoints, setMainPoints] = useState<MainPointState[]>(() => {
        if (mode === 'crear') {
            // Plantilla fresca del catálogo — se copia una sola vez aquí; a
            // partir de este punto ya no tiene ningún vínculo con el catálogo.
            return (catalogoPuntos ?? []).map((p) => ({
                mainPointKey: p.key,
                label: p.label,
                responsibleId: '',
                children: [],
            }))
        }
        // Editar un borrador: siempre a partir de sus propias fases ya
        // guardadas, nunca del catálogo vivo (aunque el catálogo haya
        // cambiado desde que se creó este borrador).
        return (initial?.mainPoints ?? []).map((mp) => ({
            mainPointKey: mp.mainPointKey,
            label: mp.title,
            responsibleId: mp.responsibleId,
            children: mp.children,
        }))
    })

    useEffect(() => {
        fetch('/api/usuarios')
            .then((r) => r.json())
            .then((data) => {
                // Trabajadores y Admins son igual de asignables como
                // responsable/encargado: un Admin también puede quedar
                // operando un punto o subpunto, no solo supervisando.
                if (Array.isArray(data)) {
                    setTrabajadores(data.filter((u: any) => u.role === 'trabajador' || u.role === 'admin'))
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

    // "Cargar modelo": trae la estructura de un proyecto ya registrado y la
    // copia hacia este, punto por punto, haciendo match por TEXTO (no por
    // mainPointKey ni por posición): si "Compras" era el punto 2 allá y hoy
    // es el 3 en el catálogo actual, su contenido se copia igual al 3 de
    // aquí porque ambos se llaman "Compras" — esto también sigue
    // funcionando si el punto se borró y se volvió a crear en el catálogo
    // (lo cual le cambia el mainPointKey pero no el nombre). Un punto
    // principal actual sin ninguna coincidencia en el modelo simplemente se
    // queda como está (vacío, si es un proyecto nuevo).
    async function aplicarModelo(folioModelo: string) {
        setCargandoModelo(true)
        try {
            const res = await fetch(`/api/proyectos/${folioModelo}/modelo`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'No se pudo cargar el modelo')

            const modeloPorTexto = new Map<string, MainPointModelo>(
                (data.mainPoints as MainPointModelo[]).map((mp) => [normalizarTexto(mp.title), mp])
            )

            const puntosConMatch = mainPoints.filter((mp) => modeloPorTexto.has(normalizarTexto(mp.label)))
            const yaHayDatos = puntosConMatch.some((mp) => mp.responsibleId || mp.children.length > 0)
            if (yaHayDatos) {
                const ok = window.confirm(
                    'Ya hay datos capturados en algunos de los puntos que este modelo va a reemplazar. ¿Quieres continuar y sobrescribirlos?'
                )
                if (!ok) {
                    setCargandoModelo(false)
                    return
                }
            }

            // Desfase único para TODO el modelo: se calcula sobre la fecha
            // más temprana de cualquier subpunto en cualquier punto
            // principal, para que arranque hoy conservando el espaciado
            // relativo entre puntos (no se recorre punto por punto por
            // separado).
            const todasLasFechas: string[] = []
            function recolectarFechas(nodes: NodoModelo[]) {
                for (const n of nodes) {
                    if (n.startDate) todasLasFechas.push(n.startDate)
                    recolectarFechas(n.children)
                }
            }
            for (const mp of data.mainPoints as MainPointModelo[]) recolectarFechas(mp.children)

            const shiftMs =
                todasLasFechas.length > 0
                    ? hoyUTC().getTime() - Math.min(...todasLasFechas.map(parseFechaUTC))
                    : 0

            setMainPoints((prev) =>
                prev.map((mp) => {
                    const match = modeloPorTexto.get(normalizarTexto(mp.label))
                    if (!match) return mp
                    return {
                        ...mp,
                        responsibleId: match.responsibleId,
                        children: clonarNodosModelo(match.children, shiftMs),
                    }
                })
            )
            setModeloAbierto(false)
        } catch (err: any) {
            alert(err.message || 'Error al cargar el modelo')
        } finally {
            setCargandoModelo(false)
        }
    }

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, phone: sanitizePhone(e.target.value) }))
    }

    function handleCostChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = sanitizeNumeric(e.target.value)
        setForm((prev) => {
            const costNum = parseFloat(v || '0')
            const advanceNum = parseFloat(prev.advancePayment || '0')
            // Sin costo no puede haber adelanto. Si el costo baja (o se borra)
            // por debajo del adelanto ya escrito, lo topamos o lo limpiamos.
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
            // El adelanto nunca puede superar el costo.
            const advancePayment = prev.cost && advanceNum > costNum ? prev.cost : v
            return { ...prev, advancePayment }
        })
    }

    // Estatus de pago: se calcula solo, nunca se edita a mano.
    const paymentStatus = useMemo(() => {
        const cost = parseFloat(form.cost || '0')
        const advance = parseFloat(form.advancePayment || '0')
        if (!form.advancePayment || advance <= 0) return 'pendiente'
        if (cost > 0 && advance >= cost) return 'pagado'
        return 'anticipo'
    }, [form.cost, form.advancePayment])

    const emailValido = useMemo(() => !form.email || EMAIL_REGEX.test(form.email), [form.email])

    // La entrega sugerida es la fecha de fin más tardía entre todos los
    // subpuntos capturados (a cualquier profundidad) en los 4 puntos con
    // trabajo real. Si todavía no hay ninguna fecha capturada, cae de
    // respaldo al cálculo viejo (hoy + días hábiles), que en ese caso da 0.
    const fechaSugerida = useMemo(() => {
        const puntosConTrabajo = mainPoints.filter((mp) => !esPuntoSoloEstatus(mp.mainPointKey))
        const maxima = fechaMasTardiaDeSubpuntos(puntosConTrabajo.flatMap((mp) => mp.children))
        if (maxima) return maxima
        const dias = puntosConTrabajo.map((mp) => diasCalculados(mp.children))
        return calcularFechaEntregaSugerida(dias)
    }, [mainPoints])

    async function enviar(recordStatus: 'borrador' | 'registrado') {
        setLoading(recordStatus)
        setError('')

        try {
            if (!form.title.trim()) throw new Error('Falta la descripción breve del proyecto')
            if (!form.clientName.trim()) throw new Error('Falta el nombre del cliente')
            if (!form.company.trim()) throw new Error('Falta la empresa')
            if (!form.phone.trim()) throw new Error('Falta el teléfono')
            if (!form.email.trim()) throw new Error('Falta el correo')
            if (!EMAIL_REGEX.test(form.email)) {
                throw new Error('El correo del cliente no tiene un formato válido')
            }

            // Válido tanto para guardar borrador como para registrar: si un
            // punto ya tiene responsable asignado o subpuntos agregados, no
            // se puede dejar a medias — título, responsable, fecha inicio y
            // fecha fin deben estar completos en cada subpunto que exista.
            for (const mp of mainPoints) {
                if (esPuntoSoloEstatus(mp.mainPointKey)) continue
                const errorSubpuntos = validarSubpuntosCompletos(mp.children, `${mainPoints.indexOf(mp) + 1}`)
                if (errorSubpuntos) throw new Error(`"${mp.label}" → ${errorSubpuntos}`)
            }

            if (recordStatus === 'registrado') {
                for (const mp of mainPoints) {
                    if (esPuntoSoloEstatus(mp.mainPointKey)) continue
                    if (!mp.responsibleId) {
                        throw new Error(`Falta asignar responsable en "${mp.label}"`)
                    }
                    if (diasCalculados(mp.children) <= 0) {
                        throw new Error(
                            `Falta agregar al menos un subpunto con fecha de inicio y fin en "${mp.label}"`
                        )
                    }
                }

                // La fecha de entrega (si se ajustó a mano) no puede quedar
                // antes de que termine el subpunto que más tarda: solo
                // aplica al registrar, no al guardar como borrador.
                if (form.estimatedDeliveryManual) {
                    const entregaManual = new Date(form.estimatedDeliveryManual + 'T00:00:00')
                    if (entregaManual < fechaSugerida) {
                        throw new Error(
                            `La fecha de entrega (${entregaManual.toLocaleDateString('es-MX')}) no puede ser anterior al ${fechaSugerida.toLocaleDateString(
                                'es-MX'
                            )}, que es cuando termina el subpunto que más tarda.`
                        )
                    }
                }
            }

            // _dataUrl queda definido (aunque sea '') en cuanto FirmaModal
            // precarga una firma existente, la reemplaza, o el Admin la
            // borra a propósito. Solo si NUNCA se tocó (undefined) se cae al
            // valor original -> así "borrar" no revive la firma anterior.
            const clientDataUrl = (clienteSigRef as any)._dataUrl
            const clientSig = clientDataUrl !== undefined ? clientDataUrl : initial?.clientSignature || ''
            const receiverDataUrl = (receptorSigRef as any)._dataUrl
            const receiverSig = receiverDataUrl !== undefined ? receiverDataUrl : initial?.receiverSignature || ''

            const body = {
                recordStatus,
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
                    // Nunca inventar un encargado: si el usuario no eligió
                    // uno, se manda vacío. Antes esto caía en
                    // trabajadores[0]?.id (el primero de la lista, al azar
                    // desde la perspectiva del usuario) — asignaba trabajo a
                    // alguien que nadie eligió, tanto al guardar borrador
                    // como al registrar. La validación de arriba ya bloquea
                    // registrar sin responsable en los puntos con trabajo
                    // real; para borrador y "solo estatus" el servidor
                    // aplica su propio respaldo documentado (el id del
                    // Admin que guarda), no un trabajador cualquiera.
                    responsibleId: mp.responsibleId,
                    estimatedDays: esPuntoSoloEstatus(mp.mainPointKey) ? 0 : diasCalculados(mp.children),
                    children: mp.children.length ? limpiarSubpuntosParaEnvio(mp.children) : undefined,
                })),
            }

            const url = mode === 'editar' ? `/api/proyectos/${folio}` : '/api/proyectos'
            const method = mode === 'editar' ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const json = await res.json()
            if (!res.ok) {
                // Si el servidor mandó el detalle campo por campo (Zod), lo
                // mostramos en vez del genérico "Datos inválidos" para saber
                // exactamente qué falta sin adivinar.
                if (Array.isArray(json?.issues) && json.issues.length > 0) {
                    const detalle = json.issues
                        .map((i: { path: string; message: string }) => `${i.path || '(general)'}: ${i.message}`)
                        .join(' | ')
                    throw new Error(`${json.error}: ${detalle}`)
                }
                throw new Error(json.error || 'Error al guardar')
            }

            if (json.emailError) {
                alert(json.emailError)
            }

            if (mode === 'editar') {
                router.push(`/admin/proyecto/${json.folio || folio}`)
            } else {
                router.push('/admin')
            }
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(null)
        }
    }

    const volverHref = mode === 'editar' && folio ? `/admin/proyecto/${folio}` : '/admin'

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={userName} userEmail={userEmail} userRole={userRole} />

            {/* Hero navy: mismo patrón que dashboard/historial/configuración,
                para que Registrar/editar un borrador se sienta parte de la
                misma pantalla en vez de un salto a otro diseño. */}
            <section style={{ background: 'var(--admin-topbar-bg)', padding: '28px 20px 64px' }}>
                <div className="admin-fade-up" style={{ maxWidth: '1180px', margin: '0 auto' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '0 0 4px' }}>
                        {mode === 'editar' ? 'Editar borrador' : 'Registrar'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 32px)', color: '#ffffff', margin: 0 }}>
                            {mode === 'editar' ? `Editar proyecto ${folio}` : 'Nuevo proyecto'}
                        </h1>
                        {mode === 'editar' && folio && (
                            <Link
                                href={volverHref}
                                className="admin-fade-up admin-fade-delay-1"
                                style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--brand-orange)', textDecoration: 'none' }}
                            >
                                ← Volver al proyecto
                            </Link>
                        )}
                    </div>

                    {mode === 'editar' && (
                        <p
                            className="admin-fade-up admin-fade-delay-1"
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--admin-warning-fg)',
                                background: 'var(--admin-warning-bg)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                margin: '14px 0 0',
                                display: 'inline-block',
                            }}
                        >
                            Este proyecto sigue como borrador. Puedes seguir editándolo o registrarlo definitivamente
                            desde aquí. Una vez registrado, ya no se podrá editar desde esta pantalla.
                        </p>
                    )}
                </div>
            </section>

            <div
                style={{
                    maxWidth: '1180px',
                    margin: '-32px auto 0',
                    padding: '0 20px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                {/* Datos generales / cliente / financieros a la misma altura en
                    escritorio (grid, se estiran igual que la tarjeta más alta
                    de la fila); en móvil el mismo truco de minmax(min(px,100%))
                    los colapsa a una sola columna en cascada, igual que antes. */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px', alignItems: 'stretch' }}>
                <section className="admin-content-card admin-fade-up admin-fade-delay-1" style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                        Datos generales
                    </h2>
                    <div>
                        <label style={labelStyle}>Descripción breve del proyecto *</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Molde para tapa de envase 500ml"
                            className="admin-input"
                            style={inputStyle}
                        />
                    </div>
                </section>

                <section className="admin-content-card admin-fade-up admin-fade-delay-2" style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                        Datos del cliente
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Nombre completo *</label>
                            <input name="clientName" value={form.clientName} onChange={handleChange} className="admin-input" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Empresa *</label>
                            <input name="company" value={form.company} onChange={handleChange} className="admin-input" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono *</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handlePhoneChange}
                                inputMode="numeric"
                                placeholder="10 dígitos"
                                className="admin-input"
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
                                className="admin-input"
                                style={{
                                    ...inputStyle,
                                    border: `1px solid ${emailValido ? 'var(--admin-card-border)' : 'var(--admin-icon-red-fg)'}`,
                                }}
                            />
                            {!emailValido && (
                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--admin-icon-red-fg)', fontSize: '11px', margin: '4px 0 0' }}>
                                    Correo con formato inválido
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="admin-content-card admin-fade-up admin-fade-delay-3" style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                        Datos financieros
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Costo</label>
                            <input
                                name="cost"
                                inputMode="decimal"
                                value={form.cost}
                                onChange={handleCostChange}
                                placeholder="0.00"
                                className="admin-input"
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
                                className="admin-input"
                                style={{
                                    ...inputStyle,
                                    opacity: costoValido ? 1 : 0.5,
                                    cursor: costoValido ? 'text' : 'not-allowed',
                                }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Estatus de pago</label>
                            <div
                                style={{
                                    ...inputStyle,
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'transparent',
                                    cursor: 'default',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        background:
                                            paymentStatus === 'pagado'
                                                ? 'var(--admin-success-bg)'
                                                : paymentStatus === 'anticipo'
                                                ? 'var(--admin-icon-orange-bg)'
                                                : '#eef1f4',
                                        color:
                                            paymentStatus === 'pagado'
                                                ? 'var(--admin-success-fg)'
                                                : paymentStatus === 'anticipo'
                                                ? 'var(--brand-orange)'
                                                : 'var(--admin-text-tertiary)',
                                    }}
                                >
                                    {paymentStatus === 'pagado' ? 'Pagado' : paymentStatus === 'anticipo' ? 'Anticipo' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                        El estatus se calcula solo a partir del costo y el adelanto: sin adelanto es "Pendiente",
                        adelanto igual al costo es "Pagado", cualquier otro adelanto mayor a cero es "Anticipo".
                    </p>
                    <div>
                        <label style={labelStyle}>Notas</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            className="admin-input"
                            style={{ ...inputStyle, resize: 'vertical' as const }}
                        />
                    </div>
                </section>
                </div>

                <section className="admin-content-card admin-fade-up admin-fade-delay-4" style={sectionStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                            Puntos principales y fases
                        </h2>
                        {mode === 'crear' && (
                            <button
                                type="button"
                                onClick={() => setModeloAbierto(true)}
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--admin-text-primary)',
                                    background: 'none',
                                    border: '1px solid var(--admin-card-border)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Cargar modelo
                            </button>
                        )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                        Aquí se configuran los puntos de trabajo del catálogo (ver Configuración). "Listo para
                        Entrega" y "Entregado" son banderas de estatus que se marcan después, directo desde el
                        detalle del proyecto.
                    </p>

                    {trabajadores.length === 0 && (
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--admin-warning-fg)',
                                background: 'var(--admin-warning-bg)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                margin: 0,
                            }}
                        >
                            No hay trabajadores dados de alta todavía. Necesitas al menos uno para asignar
                            responsables (créalos desde Configuración).
                        </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {mainPoints.map((mp, index) => {
                            if (esPuntoSoloEstatus(mp.mainPointKey)) return null
                            const dias = diasCalculados(mp.children)
                            return (
                                <div
                                    key={mp.mainPointKey}
                                    className="admin-subpanel"
                                    style={{
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: 'var(--admin-text-primary)' }}>
                                        {index + 1}. {mp.label}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                        <select
                                            value={mp.responsibleId}
                                            onChange={(e) => updateMainPoint(index, { responsibleId: e.target.value })}
                                            className="admin-input"
                                            style={inputStyle}
                                            title="Supervisa este punto, pero no lo inicia ni lo termina: eso lo hace quien esté asignado a cada subpunto de abajo."
                                        >
                                            <option value="">Encargado...</option>
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
                                                color: 'var(--admin-text-secondary)',
                                            }}
                                        >
                                            <span>Días estimados</span>
                                            <strong style={{ color: 'var(--admin-text-primary)' }}>{dias}</strong>
                                        </div>
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                                        Se calcula solo con la suma de los rangos de fecha de los subpuntos 1er nivel
                                        de abajo — agrégalos con sus fechas para que este número aparezca.
                                    </p>

                                    <SubpointEditor
                                        nodes={mp.children}
                                        onChange={(children) => updateMainPoint(index, { children })}
                                        trabajadores={trabajadores}
                                        depth={1}
                                        pathLabel={`${index + 1}`}
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
                            color: 'var(--admin-text-secondary)',
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
                            border: '1px solid var(--admin-card-border)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                        }}
                    >
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-primary)' }}>
                            Entrega sugerida: <strong>{fechaSugerida.toLocaleDateString('es-MX')}</strong>
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--admin-text-tertiary)', marginTop: '2px' }}>
                            Es la fecha de fin más tardía entre todos los subpuntos que capturaste arriba (a
                            cualquier nivel). Si todavía no hay fechas, se estima con días hábiles de Lunes a
                            Sábado desde hoy.
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Fecha de entrega (ajuste manual, opcional)</label>
                        <input
                            type="date"
                            name="estimatedDeliveryManual"
                            value={form.estimatedDeliveryManual}
                            onChange={handleChange}
                            className="admin-input"
                            style={inputStyle}
                        />
                    </div>
                </section>

                <section className="admin-content-card admin-fade-up admin-fade-delay-5" style={sectionStyle}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--admin-text-secondary)' }}>
                        Firmas
                    </h2>
                    <FirmaModal label="Firma del cliente" firmaRef={clienteSigRef} initialDataUrl={initial?.clientSignature || undefined} />
                    <FirmaModal label="Firma de quien recibe" firmaRef={receptorSigRef} initialDataUrl={initial?.receiverSignature || undefined} />
                </section>

                {error && (
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--admin-icon-red-fg)',
                            background: 'var(--admin-icon-red-bg)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '13px',
                            margin: 0,
                        }}
                    >
                        {error}
                    </p>
                )}

                <div className="admin-fade-up admin-fade-delay-5" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
                    <button
                        type="button"
                        disabled={loading !== null}
                        onClick={() => enviar('borrador')}
                        style={{
                            flex: '1 1 150px',
                            background: '#ffffff',
                            border: '1px solid var(--admin-card-border)',
                            color: 'var(--admin-text-primary)',
                            fontFamily: 'var(--font-body)',
                            padding: '14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
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
                            flex: '1 1 150px',
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
                        }}
                    >
                        {loading === 'registrado' ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
            </div>

            {modeloAbierto && (
                <CargarModeloModal
                    onElegir={aplicarModelo}
                    onCerrar={() => setModeloAbierto(false)}
                    cargando={cargandoModelo}
                />
            )}
        </main>
    )
}
