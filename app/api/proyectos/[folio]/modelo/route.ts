import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { esPuntoSoloEstatus } from '@/lib/main-points'

type FaseModelo = {
    id: string
    parentId: string | null
    depth: number
    order: number
    mainPointKey: string | null
    title: string
    description: string | null
    responsibleId: string
    startDate: Date | null
    endDate: Date | null
}

// Convierte una fecha guardada (medianoche UTC del día elegido) al string
// "YYYY-MM-DD" tal como la necesita un <input type="date">, igual que en
// app/admin/proyecto/[folio]/editar/page.tsx.
function toDateInputValue(d: Date | null): string {
    if (!d) return ''
    return d.toISOString().slice(0, 10)
}

type NodoModelo = {
    title: string
    description: string
    responsibleId: string
    startDate: string
    endDate: string
    children: NodoModelo[]
}

function buildChildren(fases: FaseModelo[], parentId: string): NodoModelo[] {
    return fases
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((f) => ({
            title: f.title,
            description: f.description || '',
            responsibleId: f.responsibleId,
            startDate: toDateInputValue(f.startDate),
            endDate: toDateInputValue(f.endDate),
            children: buildChildren(fases, f.id),
        }))
}

// Estructura de un proyecto YA REGISTRADO, para usarlo como "modelo" al
// crear uno nuevo (ver components/admin/ProyectoForm.tsx, botón "Cargar
// modelo"). Se identifica cada punto principal por su TEXTO (title), no por
// mainPointKey ni por posición/orden: el key es un snapshot que se pierde
// si el punto se borra y se vuelve a crear en el catálogo (aunque se
// llame igual), mientras que el texto es lo que de verdad identifica "cuál
// punto es" para quien usa la app. El match final (normalizando
// mayúsculas/acentos) se hace del lado del cliente en ProyectoForm.tsx.
// Los puntos "solo estatus" (Listo para Entrega/Entregado) se excluyen:
// nunca llevan estructura propia que copiar.
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const { folio } = await params

        const project = await prisma.project.findUnique({
            where: { folio },
            select: {
                recordStatus: true,
                phases: {
                    select: {
                        id: true,
                        parentId: true,
                        depth: true,
                        order: true,
                        mainPointKey: true,
                        title: true,
                        description: true,
                        responsibleId: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        })

        if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
        if (project.recordStatus !== 'registrado') {
            return NextResponse.json(
                { error: 'Solo un proyecto ya registrado se puede usar como modelo' },
                { status: 400 }
            )
        }

        const fases = project.phases

        const mainPoints = fases
            .filter((f) => f.depth === 0 && !esPuntoSoloEstatus(f.mainPointKey || ''))
            .sort((a, b) => a.order - b.order)
            .map((mp) => ({
                title: mp.title,
                responsibleId: mp.responsibleId,
                children: buildChildren(fases, mp.id),
            }))

        return NextResponse.json({ folio, mainPoints })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al leer el proyecto modelo' }, { status: 500 })
    }
}
