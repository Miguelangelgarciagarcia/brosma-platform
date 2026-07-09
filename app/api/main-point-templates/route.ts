import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generarKeyPunto, siguienteOrderConfigurable } from '@/lib/main-point-catalog'

// Catálogo completo de Puntos Principales (configurables + los 2 fijos), para
// la pantalla de Configuración. Solo Admin.
export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const puntos = await prisma.mainPointTemplate.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(puntos)
}

const crearPuntoSchema = z.object({
    label: z.string().trim().min(1, 'Falta el nombre del punto').max(80),
})

// Alta de un nuevo punto configurable. Se agrega al final de los
// configurables (antes de los 2 fijos, que siempre quedan hasta el final).
// Esto NUNCA afecta proyectos ya existentes: es solo un cambio al catálogo,
// que se copia como plantilla la próxima vez que se cree un proyecto.
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const json = await req.json()
        const parsed = crearPuntoSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            )
        }

        const order = await siguienteOrderConfigurable()
        const nuevo = await prisma.mainPointTemplate.create({
            data: { key: generarKeyPunto(), label: parsed.data.label, order, fixed: false, active: true },
        })

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'main_point_template_created',
                targetType: 'MainPointTemplate',
                targetId: nuevo.id,
                metadata: { label: nuevo.label },
            },
        })

        return NextResponse.json(nuevo, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al crear el punto' }, { status: 500 })
    }
}
