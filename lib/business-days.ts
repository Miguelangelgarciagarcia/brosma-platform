// Cálculo de fechas usando días laborables Lunes a Sábado (Domingo no cuenta).
// No contempla días festivos por ahora (se puede agregar una tabla de
// feriados más adelante si Brosma lo necesita).

/**
 * Suma `days` días laborables (Lunes-Sábado) a partir de `startDate`.
 * Si `startDate` cae en Domingo, se recorre al Lunes antes de empezar a contar.
 */
export function addBusinessDays(startDate: Date, days: number): Date {
    const result = new Date(startDate)

    // Si el día de inicio es domingo, lo corremos al lunes.
    if (result.getDay() === 0) {
        result.setDate(result.getDate() + 1)
    }

    let remaining = Math.max(0, Math.floor(days))
    while (remaining > 0) {
        result.setDate(result.getDate() + 1)
        // getDay(): 0 = domingo
        if (result.getDay() !== 0) {
            remaining -= 1
        }
    }

    return result
}

/**
 * Suma los `estimatedDays` de una lista de puntos principales y devuelve
 * la fecha de entrega sugerida a partir de hoy.
 * Se usa solo como respaldo cuando todavía no hay ningún subpunto con
 * fechas capturadas (ej. un borrador muy temprano).
 */
export function calcularFechaEntregaSugerida(
    diasEstimadosPorPunto: (number | null | undefined)[],
    desde: Date = new Date()
): Date {
    const totalDias = diasEstimadosPorPunto.reduce(
        (acc: number, d) => acc + (d && d > 0 ? d : 0),
        0
    )
    return addBusinessDays(desde, totalDias)
}

type NodoConFechas = {
    endDate?: string | null
    children?: NodoConFechas[] | null
}

// "YYYY-MM-DD" (lo que manda un <input type="date">) se interpreta en hora
// LOCAL a propósito. Si se deja que Date lo parsee tal cual, JS lo toma
// como UTC medianoche, y al mostrarlo en un huso horario detrás de UTC
// (México, por ejemplo) se recorre un día para atrás. Las fechas ISO
// completas (con hora, como las que ya vienen del backend) se parsean tal cual.
function parseFecha(str: string): Date {
    return /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T00:00:00') : new Date(str)
}

/**
 * La entrega sugerida real: la fecha de fin más tardía entre TODOS los
 * subpuntos capturados (a cualquier profundidad), de los 4 puntos con
 * trabajo real. Como cada subpunto ya trae su propia fecha de fin puesta
 * a mano por el Admin, no hace falta sumar días desde hoy: el proyecto
 * queda listo cuando termina la tarea que más tarda.
 */
export function fechaMasTardiaDeSubpuntos(nodes: NodoConFechas[] | null | undefined): Date | null {
    if (!nodes || nodes.length === 0) return null
    let max: Date | null = null
    for (const n of nodes) {
        if (n.endDate) {
            const d = parseFecha(n.endDate)
            if (!isNaN(d.getTime()) && (!max || d > max)) max = d
        }
        const childMax = fechaMasTardiaDeSubpuntos(n.children)
        if (childMax && (!max || childMax > max)) max = childMax
    }
    return max
}
