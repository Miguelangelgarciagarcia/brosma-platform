import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, trackingRateLimiter } from '@/lib/ratelimit'

const bodySchema = z.object({
    folio: z.string().trim().min(3).max(40),
    phone4: z.string().trim().regex(/^\d{4}$/, 'Deben ser 4 dígitos'),
})

// Endpoint público (sin login). Por eso:
// - Rate limit por IP (evita fuerza bruta de folios).
// - Requiere folio + últimos 4 dígitos del teléfono del cliente, no solo
//   el folio (que es adivinable/enumerable por su formato).
// - Mensaje de error genérico, sin importar cuál de los dos falló.
// - Los proyectos en "borrador" no son consultables (aún no se le
//   notificó nada al cliente).
export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const { success } = await checkRateLimit(trackingRateLimiter, ip)
        if (!success) {
            return NextResponse.json(
                { error: 'Demasiados intentos. Espera un minuto e intenta de nuevo.' },
                { status: 429 }
            )
        }

        const json = await req.json()
        const parsed = bodySchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Folio o teléfono inválidos' }, { status: 400 })
        }
        const { folio, phone4 } = parsed.data

        const generic = () =>
            NextResponse.json({ error: 'No encontramos un proyecto con ese folio y teléfono' }, { status: 404 })

        const project = await prisma.project.findUnique({ where: { folio: folio.toUpperCase() } })
        if (!project) return generic()
        if (project.recordStatus !== 'registrado') return generic()
        if (project.phone.replace(/\D/g, '').slice(-4) !== phone4) return generic()

        const fases = await prisma.phase.findMany({
            where: {
                projectId: project.id,
                depth: project.clientCanSeeSubpoints ? { in: [0, 1] } : 0,
            },
            orderBy: [{ depth: 'asc' }, { order: 'asc' }],
            select: {
                id: true,
                parentId: true,
                depth: true,
                mainPointKey: true,
                title: true,
                status: true,
            },
        })

        const puntosPrincipales = fases.filter((f) => f.depth === 0)
        const subpuntos = fases.filter((f) => f.depth === 1)

        const puntos = puntosPrincipales.map((p) => ({
            key: p.mainPointKey,
            label: p.title,
            status: p.status,
            subpuntos: project.clientCanSeeSubpoints
                ? subpuntos.filter((s) => s.parentId === p.id).map((s) => ({ title: s.title, status: s.status }))
                : undefined,
        }))

        const completados = puntosPrincipales.filter((p) => p.status === 'completado').length
        const progreso = Math.round((completados / puntosPrincipales.length) * 100)

        return NextResponse.json({
            folio: project.folio,
            title: project.title,
            status: project.status,
            progreso,
            entregaEstimada: project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto,
            puntos,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al consultar el seguimiento' }, { status: 500 })
    }
}
