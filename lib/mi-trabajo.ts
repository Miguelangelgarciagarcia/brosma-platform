import { prisma } from '@/lib/prisma'
import { hoyUTC, estaAtrasada } from '@/lib/dates'
import { esPuntoSoloEstatus } from '@/lib/main-points'

// Lógica compartida de "mi trabajo": qué fases tiene asignadas un usuario
// (Trabajador o Admin) como responsable, agrupadas para las pestañas
// Pendientes/Finalizados/A mi cargo + el carrusel de "Corriendo hoy". Vive
// aparte de app/trabajo/page.tsx porque ahora también la usa
// app/admin/mi-trabajo/page.tsx: un Admin puede quedar asignado como
// responsable de un punto igual que un Trabajador, y necesita la misma
// vista para darle seguimiento (con el header/nav de Admin alrededor en vez
// del de Trabajo).
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
    project: { folio: string; title: string; clientName: string; recordStatus: string }
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

export async function obtenerMiTrabajo(userId: string) {
    const fasesRawTodas = (await prisma.phase.findMany({
        where: { responsibleId: userId },
        include: {
            project: { select: { folio: true, title: true, clientName: true, recordStatus: true } },
            parent: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' },
    })) as FaseConProyecto[]

    // Mientras un proyecto sigue en borrador no es un compromiso real de
    // trabajo todavía — nada de lo que tenga asignado ahí debe aparecer en
    // "Mi trabajo" (ni como fase accionable ni como encargo) hasta que se
    // registre.
    const fasesRaw = fasesRawTodas.filter((f) => f.project.recordStatus !== 'borrador')

    // "Listo para Entrega" y "Entregado" son banderas de estatus del
    // proyecto, no trabajo personal: se gestionan únicamente desde el
    // detalle del proyecto (PhaseTree + botón de marcar estatus, con la
    // válvula de Admin), nunca desde "Mi trabajo". Se descartan por
    // completo aquí, no se mueven a "A mi cargo".
    const fasesSinBanderas = fasesRaw.filter((f) => !(f.depth === 0 && esPuntoSoloEstatus(f.mainPointKey || '')))

    // Un punto principal (depth 0) ya no se inicia/termina a mano: el
    // responsable ahí es solo el encargado, y su estatus se calcula solo a
    // partir de sus subpuntos (ver /api/fases/[id]). Por eso se separan de
    // la lista de trabajo real:
    // - fasesAccionables: lo que sí se puede iniciar/terminar (subpuntos).
    // - encargos: puntos principales de los que este usuario es encargado,
    //   para la pestaña "A mi cargo" (solo lectura + quién trabaja debajo).
    const esEncargoDeContenedor = (f: FaseConProyecto) => f.depth === 0
    const fasesAccionables = fasesSinBanderas.filter((f) => !esEncargoDeContenedor(f))
    const encargosRaw = fasesSinBanderas.filter(esEncargoDeContenedor)

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

    return {
        carrusel,
        pendientesPorProyecto,
        completadosPorProyecto,
        totalPendientes: pendientes.length,
        totalCompletados: completados.length,
        encargosPorProyecto,
        totalEncargos,
    }
}
