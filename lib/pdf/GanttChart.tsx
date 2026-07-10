import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Ancho fijo (en pt) de la columna de la izquierda (número + título) y del
// área de la línea de tiempo a la derecha. Landscape A4 = 842pt de ancho,
// menos 2x30pt de margen = 782pt de contenido útil.
const LEFT_WIDTH = 260
const TIMELINE_WIDTH = 782 - LEFT_WIDTH - 8

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#111',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #111',
        paddingBottom: 8,
        marginBottom: 8,
    },
    brand: { fontSize: 16, fontWeight: 700 },
    folio: { fontSize: 10, fontFamily: 'Courier' },
    legendRow: { flexDirection: 'row', gap: 14, marginBottom: 8, alignItems: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendSwatch: { width: 8, height: 8, borderRadius: 2 },
    axisHeader: {
        flexDirection: 'row',
        borderBottom: '1px solid #ccc',
        paddingBottom: 4,
        marginBottom: 2,
    },
    axisLeftLabel: { width: LEFT_WIDTH, fontSize: 7, fontWeight: 700, color: '#666', textTransform: 'uppercase' },
    axisTimeline: { width: TIMELINE_WIDTH, position: 'relative', height: 10 },
    axisTick: { position: 'absolute', fontSize: 6, color: '#888' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '0.5px solid #eee',
        paddingTop: 3,
        paddingBottom: 3,
    },
    rowLabel: {
        width: LEFT_WIDTH,
        fontSize: 7,
        paddingRight: 6,
    },
    rowTimeline: {
        width: TIMELINE_WIDTH,
        height: 10,
        position: 'relative',
    },
    bar: {
        position: 'absolute',
        top: 0,
        height: 10,
        borderRadius: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 14,
        left: 30,
        right: 30,
        fontSize: 7,
        color: '#999',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        paddingTop: 6,
    },
})

function formatFecha(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date)
}

export type FilaGantt = {
    label: string
    depth: number
    title: string
    status: string
    atrasado: boolean
    start: Date | string
    end: Date | string
}

type Proyecto = {
    folio: string
    title: string
    clientName: string
    // Fecha de entrega acordada con el cliente (manual si el Admin la
    // ajustó, si no la calculada automáticamente).
    estimatedDelivery: Date | string | null
}

function colorDeBarra(status: string): string {
    if (status === 'completado') return '#111111'
    if (status === 'en_proceso') return '#f47b30'
    return '#bbbbbb'
}

// Trunca títulos largos para que la fila no se desborde ni se monte con la
// barra de la derecha (react-pdf no soporta text-overflow: ellipsis).
function truncar(texto: string, max: number): string {
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto
}

// Duración total del proyecto en la unidad que mejor se lea: días si es
// corto, meses si dura semanas/meses, años (+ meses sueltos) si es un
// proyecto largo.
function formatDuracion(dias: number): string {
    if (dias < 60) return `${dias} día${dias === 1 ? '' : 's'}`
    if (dias < 730) {
        const meses = Math.round(dias / 30)
        return `${meses} mes${meses === 1 ? '' : 'es'}`
    }
    const anios = Math.floor(dias / 365)
    const mesesRestantes = Math.round((dias % 365) / 30)
    const base = `${anios} año${anios === 1 ? '' : 's'}`
    return mesesRestantes > 0 ? `${base} ${mesesRestantes} mes${mesesRestantes === 1 ? '' : 'es'}` : base
}

export default function GanttChart({ project, filas }: { project: Proyecto; filas: FilaGantt[] }) {
    const tieneFilas = filas.length > 0

    const inicio = tieneFilas ? new Date(Math.min(...filas.map((f) => new Date(f.start).getTime()))) : null
    const finReal = tieneFilas ? new Date(Math.max(...filas.map((f) => new Date(f.end).getTime()))) : null
    // Si todo el proyecto cae en un solo día, se le da un rango mínimo de 1
    // día para que la barra tenga ancho visible en vez de colapsar a 0.
    const fin = inicio && finReal && finReal.getTime() <= inicio.getTime()
        ? new Date(inicio.getTime() + 86400000)
        : finReal

    const totalMs = inicio && fin ? fin.getTime() - inicio.getTime() : 0

    function x(fecha: Date | string): number {
        if (!inicio || totalMs <= 0) return 0
        const t = (new Date(fecha).getTime() - inicio.getTime()) / totalMs
        return Math.max(0, Math.min(1, t)) * TIMELINE_WIDTH
    }

    const ticks = inicio && fin
        ? [0, 0.25, 0.5, 0.75, 1].map((t) => ({
              pos: t * TIMELINE_WIDTH,
              label: formatFecha(new Date(inicio.getTime() + t * totalMs)),
          }))
        : []

    // Duración real del proyecto (días naturales inclusivos, sin el
    // relleno artificial de 1 día que se usa solo para que la barra tenga
    // ancho visible cuando todo cae en el mismo día).
    const diasDuracion = inicio && finReal ? Math.round((finReal.getTime() - inicio.getTime()) / 86400000) + 1 : 0

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerRow} fixed>
                    <View>
                        <Text style={styles.brand}>BROSMA</Text>
                        <Text style={{ fontSize: 8, color: '#666' }}>Diagrama de Gantt · {project.title}</Text>
                        <Text style={{ fontSize: 8, color: '#666' }}>{project.clientName}</Text>
                        {tieneFilas && inicio && finReal && (
                            <Text style={{ fontSize: 8, color: '#333', marginTop: 4 }}>
                                Inicio: {formatFecha(inicio)} · Fin: {formatFecha(finReal)} · Duración: {formatDuracion(diasDuracion)}
                            </Text>
                        )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.folio}>{project.folio}</Text>
                        <Text style={{ fontSize: 8, fontWeight: 700, color: '#111', marginTop: 3 }}>
                            Entrega estimada: {project.estimatedDelivery ? formatFecha(project.estimatedDelivery) : '—'}
                        </Text>
                        <Text style={{ fontSize: 6, color: '#999', marginTop: 2 }}>Generado el {formatFecha(new Date())}</Text>
                    </View>
                </View>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#bbbbbb' }]} />
                        <Text>Pendiente</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#f47b30' }]} />
                        <Text>En proceso</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#111111' }]} />
                        <Text>Completado</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#e03131' }]} />
                        <Text>Atrasado</Text>
                    </View>
                </View>

                {!tieneFilas ? (
                    <Text style={{ fontSize: 9, color: '#888', marginTop: 20 }}>
                        Este proyecto todavía no tiene fechas de inicio/fin capturadas en sus subpuntos.
                    </Text>
                ) : (
                    <>
                        <View style={styles.axisHeader} fixed>
                            <Text style={styles.axisLeftLabel}>Punto</Text>
                            <View style={styles.axisTimeline}>
                                {ticks.map((t, i) => (
                                    <Text
                                        key={i}
                                        style={[
                                            styles.axisTick,
                                            { left: Math.min(Math.max(t.pos - 15, 0), TIMELINE_WIDTH - 32) },
                                        ]}
                                    >
                                        {t.label}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        {filas.map((f, i) => {
                            const left = x(f.start)
                            const width = Math.max(x(f.end) - left, 3)
                            return (
                                <View key={i} style={styles.row} wrap={false}>
                                    <Text style={[styles.rowLabel, { paddingLeft: f.depth * 8, fontWeight: f.depth === 0 ? 700 : 400 }]}>
                                        {f.label}. {truncar(f.title, 44 - f.depth * 5)}
                                    </Text>
                                    <View style={styles.rowTimeline}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    left,
                                                    width,
                                                    backgroundColor: colorDeBarra(f.status),
                                                    border: f.atrasado ? '1px solid #e03131' : 'none',
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            )
                        })}
                    </>
                )}

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `Brosma · Diagrama de Gantt del proyecto ${project.folio} · Página ${pageNumber} de ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    )
}
