import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Búsqueda de proyectos YA REGISTRADOS (nunca borradores: pueden tener
// datos a medio llenar), usada por el selector de "Cargar modelo" al crear
// un proyecto nuevo. Solo Admin.
export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')?.trim() || ''

        const proyectos = await prisma.project.findMany({
            where: {
                recordStatus: 'registrado',
                ...(q
                    ? {
                          OR: [
                              { folio: { contains: q, mode: 'insensitive' as const } },
                              { title: { contains: q, mode: 'insensitive' as const } },
                              { clientName: { contains: q, mode: 'insensitive' as const } },
                              { company: { contains: q, mode: 'insensitive' as const } },
                          ],
                      }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                folio: true,
                title: true,
                clientName: true,
                company: true,
                status: true,
                createdAt: true,
            },
        })

        return NextResponse.json(proyectos)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al buscar proyectos' }, { status: 500 })
    }
}
