import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import GanttChart, { type FilaGantt } from '@/lib/pdf/GanttChart'
import { esPuntoSoloEstatus } from '@/lib/main-points'
import { estaAtrasada, hoyUTC } from '@/lib/dates'
import React from 'react'

type FaseGantt = {
    id: string
    parentId: string | null
    order: number
    mainPointKey: string | null
    title: string
    status: string
    startDate: Date | null
    endDate: Date | null
}

export async function generarGanttPDF(projectId: string): Promise<Buffer> {
    const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })

    const fases: FaseGantt[] = await prisma.phase.findMany({
        where: { projectId },
        select: {
            id: true,
            parentId: true,
            order: true,
            mainPointKey: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
        },
        orderBy: { order: 'asc' },
    })

    const byParent = new Map<string | null, FaseGantt[]>()
    for (const f of fases) {
        const list = byParent.get(f.parentId) || []
        list.push(f)
        byParent.set(f.parentId, list)
    }
    for (const list of byParent.values()) list.sort((a, b) => a.order - b.order)

    // Rango de fechas de cada fase: el propio si lo tiene (normalmente solo
    // los subpuntos lo traen), si no el que cubre a todos sus hijos (mínimo
    // inicio, máximo fin) — misma idea que se usa para calcular los "días
    // estimados" de un punto principal en el resto de la app.
    function rangoDe(f: FaseGantt): { start: Date; end: Date } | null {
        if (f.startDate && f.endDate) return { start: f.startDate, end: f.endDate }
        const hijos = byParent.get(f.id) || []
        const rangos = hijos.map(rangoDe).filter((r): r is { start: Date; end: Date } => !!r)
        if (rangos.length === 0) return null
        return {
            start: new Date(Math.min(...rangos.map((r) => r.start.getTime()))),
            end: new Date(Math.max(...rangos.map((r) => r.end.getTime()))),
        }
    }

    const hoy = hoyUTC()
    const filas: FilaGantt[] = []

    function recorrer(parentId: string | null, label: string, depth: number) {
        const hijos = byParent.get(parentId) || []
        hijos.forEach((f, i) => {
            // "Listo para Entrega" y "Entregado" son banderas de estatus sin
            // fechas propias: no aportan nada a un cronograma, se excluyen.
            if (depth === 0 && esPuntoSoloEstatus(f.mainPointKey || '')) {
                return
            }
            const miLabel = label ? `${label}.${i + 1}` : `${i + 1}`
            const rango = rangoDe(f)
            if (rango) {
                filas.push({
                    label: miLabel,
                    depth,
                    title: f.title || 'Sin título',
                    status: f.status,
                    atrasado: estaAtrasada({ status: f.status, startDate: rango.start, endDate: rango.end }, hoy),
                    start: rango.start,
                    end: rango.end,
                })
            }
            recorrer(f.id, miLabel, depth + 1)
        })
    }
    recorrer(null, '', 0)

    const buffer = await renderToBuffer(
        React.createElement(GanttChart, {
            project: {
                folio: project.folio,
                title: project.title,
                clientName: project.clientName,
                estimatedDelivery: project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto,
            },
            filas,
        }) as any
    )

    return Buffer.from(buffer)
}
