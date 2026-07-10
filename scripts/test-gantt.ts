import { prisma } from '../lib/prisma'
import { generarGanttPDF } from '../lib/pdf/generar-gantt'
import { writeFileSync } from 'fs'

async function main() {
    const folio = process.argv[2] || 'BRS-260710-3059'
    const project = await prisma.project.findUnique({ where: { folio }, select: { id: true, folio: true } })
    if (!project) {
        console.error(`No se encontró el proyecto ${folio}`)
        process.exit(1)
    }
    const buffer = await generarGanttPDF(project.id)
    writeFileSync('/tmp/gantt-test.pdf', buffer)
    console.log(`OK: ${buffer.length} bytes escritos en /tmp/gantt-test.pdf`)
    console.log(`Primeros bytes: ${buffer.subarray(0, 8).toString('utf8')}`)
    await prisma.$disconnect()
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
