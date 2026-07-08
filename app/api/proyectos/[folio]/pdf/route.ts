import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { generarOrdenTrabajoPDF } from '@/lib/pdf/generar-orden'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ folio: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { folio } = await params
        const project = await prisma.project.findUnique({ where: { folio }, select: { id: true } })
        if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        const pdfBuffer = await generarOrdenTrabajoPDF(project.id)

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="orden-${folio}.pdf"`,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
    }
}
