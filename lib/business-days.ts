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
