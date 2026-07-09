import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { SubpointInput } from '@/lib/validations/project'

type MainPointForCreate = {
    mainPointKey: string
    // Título tal cual se debe guardar en la fase. Ya no se deriva de una
    // tabla fija en el código (el catálogo de puntos es configurable): lo
    // manda el caller, que lo saca del catálogo (al crear) o del propio
    // proyecto ya guardado (al editar).
    title: string
    responsibleId: string
    estimatedDays: number
    children?: SubpointInput[]
}

// Nota importante: Prisma solo autocompleta la FK del lado por el que se
// anida el `create` (aquí, la relación padre->hijo). El campo `projectId`
// es obligatorio en Phase y NO se rellena solo para nietos/bisnietos, así
// que construimos el árbol con creates explícitos (uno por nodo) dentro de
// una transacción, en vez de un solo `create` anidado gigante.
async function crearHijosRecursivo(
    tx: Prisma.TransactionClient,
    projectId: string,
    parentId: string,
    children: SubpointInput[] | undefined,
    depth: number
) {
    if (!children || children.length === 0) return
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const creado = await tx.phase.create({
            data: {
                projectId,
                parentId,
                depth,
                order: i,
                title: child.title,
                description: child.description || null,
                responsibleId: child.responsibleId,
                startDate: child.startDate ? new Date(child.startDate) : null,
                endDate: child.endDate ? new Date(child.endDate) : null,
                status: 'pendiente',
            },
        })
        await crearHijosRecursivo(tx, projectId, creado.id, child.children, depth + 1)
    }
}

async function crearPuntosPrincipales(
    tx: Prisma.TransactionClient,
    projectId: string,
    mainPoints: MainPointForCreate[]
) {
    for (let i = 0; i < mainPoints.length; i++) {
        const point = mainPoints[i]
        const creado = await tx.phase.create({
            data: {
                projectId,
                parentId: null,
                depth: 0,
                order: i,
                mainPointKey: point.mainPointKey,
                title: point.title,
                responsibleId: point.responsibleId,
                estimatedDays: point.estimatedDays,
                status: 'pendiente',
            },
        })
        await crearHijosRecursivo(tx, projectId, creado.id, point.children, 1)
    }
}

/**
 * Crea los 6 Puntos Principales (depth 0) de un proyecto ya existente, junto
 * con todos sus subpuntos infinitos, dentro de una única transacción.
 */
export async function crearArbolFases(projectId: string, mainPoints: MainPointForCreate[]) {
    await prisma.$transaction(async (tx) => {
        await crearPuntosPrincipales(tx, projectId, mainPoints)
    })
}

/**
 * Reemplaza por completo el árbol de fases de un proyecto (se usa al editar
 * un borrador: se borra todo lo anterior y se recrea desde cero con lo que
 * mandó el formulario). Va en una sola transacción para que nunca quede el
 * proyecto sin fases si algo falla a la mitad.
 */
export async function reemplazarArbolFases(projectId: string, mainPoints: MainPointForCreate[]) {
    await prisma.$transaction(async (tx) => {
        await tx.phase.deleteMany({ where: { projectId } })
        await crearPuntosPrincipales(tx, projectId, mainPoints)
    })
}

async function reconciliarHijos(
    tx: Prisma.TransactionClient,
    projectId: string,
    parentId: string,
    children: SubpointInput[] | undefined,
    depth: number,
    idsConservados: Set<string>,
    idsCompletados: Set<string>
) {
    if (!children || children.length === 0) return
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.id) {
            idsConservados.add(child.id)
            // Una fase ya marcada como completada por un trabajador no se
            // toca: ni se actualiza su info ni se borra, aunque el Admin la
            // haya editado o quitado del formulario. Sí se sigue recorriendo
            // hacia sus hijos por si alguno de ellos no está completo.
            if (!idsCompletados.has(child.id)) {
                await tx.phase.update({
                    where: { id: child.id },
                    data: {
                        parentId,
                        depth,
                        order: i,
                        title: child.title,
                        description: child.description || null,
                        responsibleId: child.responsibleId,
                        startDate: child.startDate ? new Date(child.startDate) : null,
                        endDate: child.endDate ? new Date(child.endDate) : null,
                    },
                })
            }
            await reconciliarHijos(tx, projectId, child.id, child.children, depth + 1, idsConservados, idsCompletados)
        } else {
            // Subpunto agregado en esta edición: no existía, se crea nuevo.
            const creado = await tx.phase.create({
                data: {
                    projectId,
                    parentId,
                    depth,
                    order: i,
                    title: child.title,
                    description: child.description || null,
                    responsibleId: child.responsibleId,
                    startDate: child.startDate ? new Date(child.startDate) : null,
                    endDate: child.endDate ? new Date(child.endDate) : null,
                    status: 'pendiente',
                },
            })
            idsConservados.add(creado.id)
            await reconciliarHijos(tx, projectId, creado.id, child.children, depth + 1, idsConservados, idsCompletados)
        }
    }
}

/**
 * Actualiza el árbol de fases de un proyecto YA REGISTRADO sin perder el
 * progreso ya marcado: los puntos principales y subpuntos que sigan en el
 * árbol enviado se actualizan en su lugar (nunca se les toca status ni
 * completedAt), los subpuntos nuevos se crean, y los que el Admin haya
 * quitado del formulario se borran. Todo en una sola transacción.
 *
 * Protección extra: ninguna fase ya marcada "completado" por un trabajador
 * se actualiza ni se borra, sin importar lo que mande el formulario (aunque
 * la UI ya bloquea editarlas/eliminarlas, esto es el resguardo real).
 */
export async function actualizarArbolFasesPreservandoProgreso(
    projectId: string,
    mainPoints: MainPointForCreate[]
) {
    await prisma.$transaction(async (tx) => {
        const actuales = await tx.phase.findMany({
            where: { projectId },
            select: { id: true, status: true },
        })
        const idsActuales = new Set(actuales.map((p) => p.id))
        const idsCompletados = new Set(actuales.filter((p) => p.status === 'completado').map((p) => p.id))
        const idsConservados = new Set<string>()

        for (let i = 0; i < mainPoints.length; i++) {
            const point = mainPoints[i]
            // Los 6 puntos principales siempre existen ya en un proyecto
            // registrado (se identifican por mainPointKey, no cambian de id).
            const mainPhase = await tx.phase.findFirst({
                where: { projectId, depth: 0, mainPointKey: point.mainPointKey },
                select: { id: true },
            })

            if (!mainPhase) {
                // No debería pasar en un proyecto ya registrado, pero por si
                // acaso: se crea para no perder el punto.
                const creado = await tx.phase.create({
                    data: {
                        projectId,
                        parentId: null,
                        depth: 0,
                        order: i,
                        mainPointKey: point.mainPointKey,
                        title: point.title,
                        responsibleId: point.responsibleId,
                        estimatedDays: point.estimatedDays,
                        status: 'pendiente',
                    },
                })
                idsConservados.add(creado.id)
                await reconciliarHijos(tx, projectId, creado.id, point.children, 1, idsConservados, idsCompletados)
                continue
            }

            idsConservados.add(mainPhase.id)
            if (!idsCompletados.has(mainPhase.id)) {
                await tx.phase.update({
                    where: { id: mainPhase.id },
                    data: { order: i, responsibleId: point.responsibleId, estimatedDays: point.estimatedDays },
                })
            }
            await reconciliarHijos(tx, projectId, mainPhase.id, point.children, 1, idsConservados, idsCompletados)
        }

        // Cualquier fase que ya no aparezca en el árbol enviado se borra (el
        // Admin la quitó desde el formulario) — excepto las ya completadas,
        // que nunca se borran aunque hayan desaparecido del formulario. El
        // cascade de la relación padre-hijo se encarga de sus propios hijos.
        const idsABorrar = Array.from(idsActuales).filter(
            (id) => !idsConservados.has(id) && !idsCompletados.has(id)
        )
        if (idsABorrar.length > 0) {
            await tx.phase.deleteMany({ where: { id: { in: idsABorrar } } })
        }
    })
}
