import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { SubpointInput } from '@/lib/validations/project'
import { labelDePunto } from '@/lib/main-points'

type MainPointForCreate = {
    mainPointKey: string
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

/**
 * Crea los 6 Puntos Principales (depth 0) de un proyecto ya existente, junto
 * con todos sus subpuntos infinitos, dentro de una única transacción.
 */
export async function crearArbolFases(projectId: string, mainPoints: MainPointForCreate[]) {
    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < mainPoints.length; i++) {
            const point = mainPoints[i]
            const creado = await tx.phase.create({
                data: {
                    projectId,
                    parentId: null,
                    depth: 0,
                    order: i,
                    mainPointKey: point.mainPointKey,
                    title: labelDePunto(point.mainPointKey),
                    responsibleId: point.responsibleId,
                    estimatedDays: point.estimatedDays,
                    status: 'pendiente',
                },
            })
            await crearHijosRecursivo(tx, projectId, creado.id, point.children, 1)
        }
    })
}
