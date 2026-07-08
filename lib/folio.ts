import { prisma } from '@/lib/prisma'

function generarFolioCandidato(): string {
    const fecha = new Date()
    const anio = fecha.getFullYear().toString().slice(-2)
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 9000) + 1000
    return `BRS-${anio}${mes}${dia}-${random}`
}

/** Genera un folio único (reintenta si por rarísima coincidencia ya existe). */
export async function generarFolioUnico(): Promise<string> {
    let folio = generarFolioCandidato()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existe = await prisma.project.findUnique({ where: { folio } })
        if (!existe) return folio
        folio = generarFolioCandidato()
    }
}
