// Los Puntos Principales de un proyecto ya NO son una lista fija: el Admin
// los configura desde Configuración (ver lib/main-point-catalog.ts, que lee
// la tabla MainPointTemplate). Este archivo se queda solo con lo que sigue
// siendo universal y sí debe poder usarse también en Client Components
// (por eso NO importa Prisma aquí — mantenerlo puro/sync es a propósito).
//
// Las únicas 2 excepciones realmente fijas en todo el sistema son "Listo
// para Entrega" y "Entregado": siempre existen, siempre van al final en ese
// orden, y tienen comportamiento especial de "solo estatus" (sin
// responsable, sin subpuntos). Sus keys son literales y no cambian nunca.
export const KEY_LISTO_ENTREGA = 'listo_entrega'
export const KEY_ENTREGADO = 'entregado'

// "Listo para Entrega" y "Entregado" son banderas de estatus puro: no
// llevan trabajador asignado, ni días estimados, ni subpuntos. Se marcan
// como completados directamente desde el panel Admin (Fase 4).
export const PUNTOS_SOLO_ESTATUS: string[] = [KEY_LISTO_ENTREGA, KEY_ENTREGADO]

export function esPuntoSoloEstatus(key: string): boolean {
    return PUNTOS_SOLO_ESTATUS.includes(key)
}

// Forma mínima de un punto del catálogo, tal como la necesitan los
// formularios (crear/editar) para armar su UI. Ver lib/main-point-catalog.ts
// para la versión que sí lee de la base de datos.
export type CatalogoPunto = {
    key: string
    label: string
    order: number
    fixed: boolean
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
