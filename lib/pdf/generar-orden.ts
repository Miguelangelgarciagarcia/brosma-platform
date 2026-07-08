import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import OrdenTrabajo from '@/lib/pdf/OrdenTrabajo'
import React from 'react'

/**
 * Genera el PDF de la Orden de Trabajo de un proyecto ya creado.
 * Solo incluye los Puntos Principales (no subpuntos) — es un resumen para
 * el cliente, el detalle interno vive en el panel Admin.
 */
export async function generarOrdenTrabajoPDF(projectId: string): Promise<Buffer> {
    const project = await prisma.project.findUniqueOrThrow({
        where: { id: projectId },
    })

    const mainPoints = await prisma.phase.findMany({
        where: { projectId, depth: 0 },
        include: { responsible: { select: { name: true } } },
        orderBy: { order: 'asc' },
    })

    const buffer = await renderToBuffer(
        React.createElement(OrdenTrabajo, { project, mainPoints }) as any
    )

    return Buffer.from(buffer)
}
