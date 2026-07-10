// Cálculo compartido del % de avance de un proyecto, a partir de su árbol
// plano de fases. Vive aparte de app/api/seguimiento/route.ts para poder
// reusarlo también en el dashboard de Admin (coloreado de cada card) sin
// duplicar la lógica ni arriesgarse a que las dos versiones se desalineen.
import { esPuntoSoloEstatus } from '@/lib/main-points'
import { estaAtrasada, hoyUTC } from '@/lib/dates'

export type FaseParaProgreso = {
    id: string
    parentId: string | null
    mainPointKey: string | null
    status: string
    startDate?: Date | string | null
    endDate?: Date | string | null
}

// Las "hojas de trabajo" son las unidades más chicas de trabajo real: fases
// sin hijos, excluyendo "Listo para Entrega"/"Entregado" (esas son banderas
// de cierre administrativo, no trabajo).
export function hojasDeTrabajo<T extends FaseParaProgreso>(fases: T[]): T[] {
    const idsConHijos = new Set(fases.map((f) => f.parentId).filter((id): id is string => !!id))
    return fases.filter((f) => !idsConHijos.has(f.id) && !esPuntoSoloEstatus(f.mainPointKey || ''))
}

/**
 * % de avance por tramos:
 * - Trabajo real en curso: proporcional, topado en 94.
 * - Todo el trabajo real completo, pero sin marcar "Listo para Entrega": 95.
 * - "Listo para Entrega" marcado, sin marcar "Entregado": 99.
 * - "Entregado" marcado: 100.
 */
export function calcularProgreso(todasLasFases: FaseParaProgreso[]): number {
    const hojas = hojasDeTrabajo(todasLasFases)
    const completadas = hojas.filter((h) => h.status === 'completado').length
    const progresoTrabajo = hojas.length > 0 ? Math.round((completadas / hojas.length) * 100) : 0
    const trabajoCompleto = hojas.length > 0 && completadas === hojas.length

    const listoEntregaCompletado = todasLasFases.some((f) => f.mainPointKey === 'listo_entrega' && f.status === 'completado')
    const entregadoCompletado = todasLasFases.some((f) => f.mainPointKey === 'entregado' && f.status === 'completado')

    if (entregadoCompletado) return 100
    if (listoEntregaCompletado) return 99
    if (trabajoCompleto) return 95
    return Math.min(progresoTrabajo, 94)
}

/**
 * true si algún punto/subpunto del proyecto (a cualquier profundidad) ya
 * debió haber iniciado o terminado y no lo ha hecho.
 */
export function hayAtraso(todasLasFases: FaseParaProgreso[], hoy: Date = hoyUTC()): boolean {
    return todasLasFases.some((f) => estaAtrasada(f, hoy))
}
