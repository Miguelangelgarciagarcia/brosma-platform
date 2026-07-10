import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { generarGanttPDF } from '@/lib/pdf/generar-gantt'

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
        const project = await prisma.project.findUnique({ where: { folio }, select: { id: true } })
        if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        const pdfBuffer = await generarGanttPDF(project.id)

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="gantt-${folio}.pdf"`,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al generar el diagrama de Gantt' }, { status: 500 })
    }
}
