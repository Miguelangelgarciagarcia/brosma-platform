// Utilidades de fechas compartidas (contadores anuales, cálculo de entregas, etc.)

/**
 * Devuelve el rango [inicio, fin) del año dado (o el actual) en hora local.
 */
export function getYearRange(year: number = new Date().getFullYear()) {
    const start = new Date(year, 0, 1, 0, 0, 0, 0)
    const end = new Date(year + 1, 0, 1, 0, 0, 0, 0)
    return { start, end }
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(d)
}
