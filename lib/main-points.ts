// Los 6 Puntos Principales son fijos en todo el sistema. Cada proyecto nuevo
// genera automáticamente estas 6 fases (depth 0); el cliente siempre las ve
// en su línea de tiempo pública.

export type MainPointKey =
    | 'planeacion'
    | 'inicio_proyecto'
    | 'pruebas'
    | 'calidad'
    | 'listo_entrega'
    | 'entregado'

export const MAIN_POINTS: { key: MainPointKey; order: number; label: string }[] = [
    { key: 'planeacion', order: 1, label: 'Planeación' },
    { key: 'inicio_proyecto', order: 2, label: 'Inicio de Proyecto' },
    { key: 'pruebas', order: 3, label: 'Pruebas' },
    { key: 'calidad', order: 4, label: 'Calidad' },
    { key: 'listo_entrega', order: 5, label: 'Listo para Entrega' },
    { key: 'entregado', order: 6, label: 'Entregado' },
]

export function labelDePunto(key: string): string {
    return MAIN_POINTS.find((p) => p.key === key)?.label ?? key
}

// "Listo para Entrega" y "Entregado" son banderas de estatus puro: no
// llevan trabajador asignado, ni días estimados, ni subpuntos. Se marcan
// como completados directamente desde el panel Admin (Fase 4).
export const PUNTOS_SOLO_ESTATUS: MainPointKey[] = ['listo_entrega', 'entregado']

export function esPuntoSoloEstatus(key: string): boolean {
    return (PUNTOS_SOLO_ESTATUS as string[]).includes(key)
}

// "Guardar para seguir editando" permite subpuntos a medio llenar sin
// responsable todavía (ver lib/validations/project.ts). Pero Phase.responsibleId
// es una FK obligatoria en la base: no se puede insertar con ''. Como
// respaldo técnico (solo mientras es borrador) se usa el id del Admin que
// está guardando, igual que ya se hace para los puntos "solo estatus".
export function rellenarResponsablesFaltantes<
    T extends { responsibleId: string; children?: T[] }
>(nodes: T[], fallbackId: string): T[] {
    return nodes.map((n) => ({
        ...n,
        responsibleId: n.responsibleId || fallbackId,
        children: n.children ? rellenarResponsablesFaltantes(n.children, fallbackId) : n.children,
    }))
}
