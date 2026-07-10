import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CarruselHoy from '@/components/trabajo/CarruselHoy'
import PendientesFinalizadosTabs from '@/components/trabajo/PendientesFinalizadosTabs'
import { hoyUTC, estaAtrasada } from '@/lib/dates'
import { esPuntoSoloEstatus } from '@/lib/main-points'

type FaseConProyecto = {
    id: string
    projectId: string
    depth: number
    mainPointKey: string | null
    title: string
    description: string | null
    status: string
    startDate: Date | string | null
    endDate: Date | string | null
    project: { folio: string; title: string; clientName: string }
    parent: { title: string } | null
}

type FaseConFlags = FaseConProyecto & { trabajando: boolean; retrasado: boolean }

// Del más cercano (fecha de fin más próxima) al más lejano. Los que no
// tienen fecha de fin capturada se van hasta el final.
function ordenarPorCercania(fases: FaseConFlags[]): FaseConFlags[] {
    return [...fases].sort((a, b) => {
        const da = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const db = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return da - db
    })
}

function agruparPorProyecto(fases: FaseConFlags[]) {
    const grupos = new Map<string, { folio: string; title: string; clientName: string; fases: FaseConFlags[] }>()
    for (const f of fases) {
        const key = f.project.folio
        if (!grupos.has(key)) {
            grupos.set(key, { folio: f.project.folio, title: f.project.title, clientName: f.project.clientName, fases: [] })
        }
        grupos.get(key)!.fases.push(f)
    }
    return Array.from(grupos.values())
}

export default async function TrabajoPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const fasesRaw = await prisma.phase.findMany({
        where: { responsibleId: session.user.id },
        include: {
            project: { select: { folio: true, title: true, clientName: true } },
            parent: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' },
    }) as FaseConProyecto[]

    // Un punto principal (depth 0, salvo "Listo para Entrega"/"Entregado")
    // ya no se inicia/termina a mano: el responsable ahí es solo el
    // encargado, y su estatus se calcula solo a partir de sus subpuntos (ver
    // /api/fases/[id]). Por eso se separan de la lista de trabajo real:
    // - fasesAccionables: lo que sí se puede iniciar/terminar (subpuntos +
    //   los 2 puntos "solo estatus", que siguen su flujo de siempre).
    // - encargos: puntos principales de los que este usuario es encargado,
    //   para la pestaña "A mi cargo" (solo lectura + quién trabaja debajo).
    const esEncargoDeContenedor = (f: FaseConProyecto) => f.depth === 0 && !esPuntoSoloEstatus(f.mainPointKey || '')
    const fasesAccionables = fasesRaw.filter((f) => !esEncargoDeContenedor(f))
    const encargosRaw = fasesRaw.filter(esEncargoDeContenedor)

    // Ojo: los subpuntos de un punto principal pueden anidarse a cualquier
    // profundidad (1.1, 1.1.1, 1.1.1.1...). Antes aquí solo se traían los
    // hijos DIRECTOS del punto principal (depth+1), así que un atraso en un
    // nivel más profundo (ej. 1.1.1) ni se detectaba ni afectaba el orden.
    // Se trae todo el árbol de los proyectos donde este usuario es
    // encargado, y de ahí se sacan las hojas reales (misma idea que
    // lib/progreso.ts: la hoja es la unidad de trabajo real).
    const idsProyectosConEncargo = Array.from(new Set(encargosRaw.map((e) => e.projectId)))
    type FaseArbol = {
        id: string
        projectId: string
        parentId: string | null
        title: string
        status: string
        startDate: Date | string | null
        endDate: Date | string | null
        responsible: { name: string }
    }
    const todasFasesDeProyectosConEncargo: FaseArbol[] =
        idsProyectosConEncargo.length > 0
            ? await prisma.phase.findMany({
                  where: { projectId: { in: idsProyectosConEncargo } },
                  select: {
                      id: true,
                      projectId: true,
                      parentId: true,
                      title: true,
                      status: true,
                      startDate: true,
                      endDate: true,
                      responsible: { select: { name: true } },
                  },
                  orderBy: { order: 'asc' },
              })
            : []

    // Numeración real (1, 1.1, 1.2, 2...) tal como está en la base de datos:
    // el número de un punto principal es su posición entre TODOS los puntos
    // principales del proyecto (no solo los que este usuario tiene a cargo),
    // y cada subpunto hereda el número de su padre + su posición entre sus
    // hermanos, igual que en el detalle de proyecto del admin.
    function numeroDePuntoPrincipal(punto: { id: string; projectId: string }): number {
        const hermanos = todasFasesDeProyectosConEncargo.filter((f) => f.projectId === punto.projectId && f.parentId === null)
        return hermanos.findIndex((f) => f.id === punto.id) + 1
    }

    // Hojas reales (sin hijos) de un nodo, a cualquier profundidad, con su
    // etiqueta jerárquica completa (ej. "1.2.1").
    function hojasDeConLabel(parentId: string, prefix: string): (FaseArbol & { label: string })[] {
        const hijos = todasFasesDeProyectosConEncargo.filter((f) => f.parentId === parentId)
        if (hijos.length === 0) return []
        return hijos.flatMap((h, i) => {
            const label = `${prefix}.${i + 1}`
            const nietos = hojasDeConLabel(h.id, label)
            return nietos.length > 0 ? nietos : [{ ...h, label }]
        })
    }

    // "A mi cargo" mantiene el orden real de registro (1, 1.1, 1.2, 2...):
    // no se reordena por atraso ni por fecha. El atraso solo se marca como
    // aviso visual (badge + parpadeo), pero la secuencia de los puntos y
    // subpuntos es la que corresponde según cómo se armó el proyecto. Un
    // punto que ya está completado (todos sus subpuntos cerrados) ya no
    // tiene nada pendiente que supervisar, así que no tiene caso seguir
    // mostrándolo aquí.
    const encargosActivos = encargosRaw.filter((f) => f.status !== 'completado')
    const encargosPorProyecto = (() => {
        const grupos = new Map<
            string,
            {
                folio: string
                title: string
                clientName: string
                puntos: {
                    id: string
                    label: string
                    title: string
                    status: string
                    atrasado: boolean
                    subpuntos: { id: string; label: string; title: string; status: string; responsableName: string; atrasado: boolean }[]
                }[]
            }
        >()
        for (const punto of encargosActivos) {
            const key = punto.project.folio
            if (!grupos.has(key)) {
                grupos.set(key, { folio: punto.project.folio, title: punto.project.title, clientName: punto.project.clientName, puntos: [] })
            }
            const labelPunto = String(numeroDePuntoPrincipal(punto))
            const subpuntos = hojasDeConLabel(punto.id, labelPunto).map((s) => ({
                id: s.id,
                label: s.label,
                title: s.title,
                status: s.status,
                responsableName: s.responsible.name,
                atrasado: estaAtrasada(s, hoyUTC()),
            }))
            const grupo = grupos.get(key)!
            grupo.puntos.push({
                id: punto.id,
                label: labelPunto,
                title: punto.title,
                status: punto.status,
                // El punto principal en sí nunca tiene fechas propias, pero
                // "hereda" el parpadeo si alguno de sus subpuntos está atrasado.
                atrasado: subpuntos.some((s) => s.atrasado),
                subpuntos,
            })
        }

        return Array.from(grupos.values())
    })()

    const totalEncargos = encargosActivos.length

    const hoy = hoyUTC()

    const esHoy = (f: FaseConProyecto) =>
        f.status !== 'completado' &&
        !!f.startDate &&
        !!f.endDate &&
        new Date(f.startDate) <= hoy &&
        hoy <= new Date(f.endDate)

    // "Atrasado" ahora cubre dos casos: ya debió terminar y no terminó, o ya
    // debió iniciar (pasó su fecha de inicio) y sigue sin ni siquiera
    // marcarse como iniciado (ver lib/dates.ts).
    const fases: FaseConFlags[] = fasesAccionables.map((f) => ({
        ...f,
        trabajando: f.status === 'en_proceso',
        retrasado: estaAtrasada(f, hoy),
    }))

    // "Corriendo hoy" no es solo lo que cae hoy en el calendario: también
    // aquí aparece cualquier punto atrasado (de ayer o de días anteriores)
    // que ni siquiera se ha marcado como iniciado, para que no se pierda de
    // vista.
    const carrusel = ordenarPorCercania(fases.filter((f) => f.status !== 'completado' && (esHoy(f) || f.retrasado)))

    const pendientes = ordenarPorCercania(fases.filter((f) => f.status !== 'completado'))
    const completados = fases.filter((f) => f.status === 'completado')

    const pendientesPorProyecto = agruparPorProyecto(pendientes)
    const completadosPorProyecto = agruparPorProyecto(completados)

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <div
                style={{
                    background: 'var(--brand-navy-deep)',
                    borderBottom: '1px solid var(--brand-panel-border)',
                    padding: '14px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-orange)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '0.1em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        GRUPO BROSMA
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <span
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--brand-panel-fg2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '140px',
                        }}
                    >
                        {session.user?.name}
                    </span>
                    <Link href="/cuenta" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', textDecoration: 'none' }}>
                        Mi cuenta
                    </Link>
                    <form
                        action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/login' })
                        }}
                    >
                        <button
                            type="submit"
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--brand-panel-fg2)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Salir
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: '#ffffff', margin: '0 0 4px' }}>
                        ¡Bienvenido, {session.user?.name?.split(' ')[0]}!
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg3)', margin: 0 }}>
                        Esto es lo que tienes en puerta hoy.
                    </p>
                </div>

                <div>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg2)', marginBottom: '10px' }}>
                        Corriendo hoy ({carrusel.length})
                    </h2>
                    {carrusel.length === 0 ? (
                        <div
                            style={{
                                background: 'var(--brand-panel-card)',
                                border: '1px solid var(--brand-panel-border)',
                                borderRadius: '10px',
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--brand-panel-fg3)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                            }}
                        >
                            No tienes nada agendado para hoy.
                        </div>
                    ) : (
                        <CarruselHoy fases={carrusel} />
                    )}
                </div>

                <PendientesFinalizadosTabs
                    pendientes={pendientesPorProyecto}
                    completados={completadosPorProyecto}
                    totalPendientes={pendientes.length}
                    totalCompletados={completados.length}
                    aCargo={encargosPorProyecto}
                    totalACargo={totalEncargos}
                />
            </div>
        </main>
    )
}
