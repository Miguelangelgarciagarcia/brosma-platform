// Acceso a la tabla MainPointTemplate (catálogo configurable de Puntos
// Principales). Este archivo SÍ importa Prisma a propósito: solo se debe usar
// desde Server Components / Route Handlers, nunca desde un Client Component
// (por eso las funciones de lib/main-points.ts, que sí se usan en el
// navegador, viven en un archivo aparte sin esta dependencia).
import { prisma } from '@/lib/prisma'
import type { CatalogoPunto } from '@/lib/main-points'

// Catálogo completo tal como está guardado, para la pantalla de
// Configuración: incluye activos, desactivados, y los 2 fijos.
export async function obtenerCatalogoCompleto() {
    return prisma.mainPointTemplate.findMany({ orderBy: { order: 'asc' } })
}

// Lo que se debe ofrecer al crear un proyecto NUEVO: los puntos
// configurables activos + los 2 fijos, en orden. Esto es una plantilla —
// una vez creado el proyecto, sus Phase quedan totalmente independientes de
// este catálogo (editar/desactivar puntos después no las afecta).
export async function obtenerPuntosParaNuevoProyecto(): Promise<CatalogoPunto[]> {
    const filas = await prisma.mainPointTemplate.findMany({
        where: { OR: [{ active: true }, { fixed: true }] },
        orderBy: { order: 'asc' },
    })
    return filas.map((f) => ({ key: f.key, label: f.label, order: f.order, fixed: f.fixed }))
}

// Identificador opaco único para un punto configurable nuevo. No lleva
// significado semántico (a diferencia de "listo_entrega"/"entregado"), solo
// identifica la fila.
export function generarKeyPunto(): string {
    return `punto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// Siguiente valor de "order" para un punto configurable nuevo: justo antes
// de los 2 fijos (que siempre usan valores >= 9000), y después del último
// configurable existente.
export async function siguienteOrderConfigurable(): Promise<number> {
    const ultimo = await prisma.mainPointTemplate.findFirst({
        where: { fixed: false },
        orderBy: { order: 'desc' },
    })
    return ultimo ? ultimo.order + 1 : 1
}
