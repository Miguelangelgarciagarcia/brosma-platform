// Utilidades de fechas compartidas (contadores anuales, cálculo de entregas, etc.)

/**
 * Devuelve el rango [inicio, fin) del año dado (o el actual) en hora local.
 */
export function getYearRange(year: number = new Date().getFullYear()) {
    const start = new Date(year, 0, 1, 0, 0, 0, 0)
    const end = new Date(year + 1, 0, 1, 0, 0, 0, 0)
    return { start, end }
}

/**
 * "Hoy" en hora de México, representado como medianoche UTC del mismo día
 * — así se puede comparar directo contra startDate/endDate de una Phase,
 * que se guardan igual (medianoche UTC del día que se eligió en el
 * calendario). Evita el mismo bug de "un día menos" que ya se corrigió en
 * el resto de la app.
 */
export function hoyUTC(): Date {
    const hoyStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
    return new Date(hoyStr + 'T00:00:00.000Z')
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = typeof date === 'string' ? new Date(date) : date
    // Todas las fechas "de calendario" (entrega, subpuntos, etc.) se guardan
    // como medianoche UTC del día elegido. Si se formatean con el huso
    // horario local del servidor/navegador, en husos detrás de UTC (México,
    // por ejemplo) se corren un día para atrás. Forzamos UTC al mostrarlas
    // para que siempre coincida con el día que se seleccionó.
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(d)
}
