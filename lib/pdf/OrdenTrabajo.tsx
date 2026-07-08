import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#111',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #111',
        paddingBottom: 10,
        marginBottom: 14,
    },
    brand: { fontSize: 18, fontWeight: 700 },
    folio: { fontSize: 11, fontFamily: 'Courier' },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#444',
        marginBottom: 4,
        marginTop: 12,
    },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    label: { fontSize: 8, color: '#666', textTransform: 'uppercase' },
    value: { fontSize: 10, marginBottom: 6 },
    table: { marginTop: 6, border: '1px solid #ddd' },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f2f2f2',
        borderBottom: '1px solid #ddd',
        padding: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #eee',
        padding: 4,
    },
    th: { fontSize: 8, fontWeight: 700, flex: 1 },
    td: { fontSize: 9, flex: 1 },
    firmaBox: {
        border: '1px solid #ccc',
        height: 70,
        width: '45%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    firmaImg: { maxHeight: 60, maxWidth: '100%' },
    footer: {
        marginTop: 24,
        fontSize: 8,
        color: '#888',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        paddingTop: 8,
    },
})

function formatFecha(d: Date | string | null | undefined) {
    if (!d) return '—'
    const date = typeof d === 'string' ? new Date(d) : d
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

type MainPointRow = {
    title: string
    responsible: { name: string }
    estimatedDays: number | null
    status: string
}

type OrdenTrabajoProps = {
    project: {
        folio: string
        title: string
        clientName: string
        company: string | null
        phone: string
        email: string | null
        cost: number | null
        advancePayment: number | null
        paymentStatus: string
        notes: string | null
        estimatedDeliveryManual: Date | string | null
        estimatedDeliveryAuto: Date | string | null
        clientSignature: string | null
        receiverSignature: string | null
        createdAt: Date | string
    }
    mainPoints: MainPointRow[]
}

export default function OrdenTrabajo({ project, mainPoints }: OrdenTrabajoProps) {
    const entrega = project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.brand}>BROSMA</Text>
                        <Text style={{ fontSize: 9, color: '#666' }}>Orden de Trabajo</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.folio}>{project.folio}</Text>
                        <Text style={{ fontSize: 8, color: '#666' }}>{formatFecha(project.createdAt)}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Proyecto</Text>
                <Text style={styles.value}>{project.title}</Text>

                <Text style={styles.sectionTitle}>Datos del cliente</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Nombre</Text>
                        <Text style={styles.value}>{project.clientName}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Empresa</Text>
                        <Text style={styles.value}>{project.company || '—'}</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Teléfono</Text>
                        <Text style={styles.value}>{project.phone}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Correo</Text>
                        <Text style={styles.value}>{project.email || '—'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Datos financieros</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Costo total</Text>
                        <Text style={styles.value}>{project.cost != null ? `$${project.cost.toLocaleString('es-MX')}` : '—'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Adelanto</Text>
                        <Text style={styles.value}>{project.advancePayment != null ? `$${project.advancePayment.toLocaleString('es-MX')}` : '—'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Estatus de pago</Text>
                        <Text style={styles.value}>{project.paymentStatus}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Entrega estimada</Text>
                <Text style={styles.value}>{formatFecha(entrega)}</Text>

                {project.notes && (
                    <>
                        <Text style={styles.sectionTitle}>Notas</Text>
                        <Text style={styles.value}>{project.notes}</Text>
                    </>
                )}

                <Text style={styles.sectionTitle}>Puntos principales del proyecto</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.th}>Punto</Text>
                        <Text style={styles.th}>Responsable</Text>
                        <Text style={styles.th}>Días est.</Text>
                        <Text style={styles.th}>Estatus</Text>
                    </View>
                    {mainPoints.map((mp, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.td}>{i + 1}. {mp.title}</Text>
                            <Text style={styles.td}>{mp.responsible?.name}</Text>
                            <Text style={styles.td}>{mp.estimatedDays ?? '—'}</Text>
                            <Text style={styles.td}>{mp.status}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Firmas</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <View>
                        <View style={styles.firmaBox}>
                            {project.clientSignature ? (
                                <Image src={project.clientSignature} style={styles.firmaImg} />
                            ) : (
                                <Text style={{ fontSize: 8, color: '#aaa' }}>Sin firma</Text>
                            )}
                        </View>
                        <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 4 }}>Firma del cliente</Text>
                    </View>
                    <View>
                        <View style={styles.firmaBox}>
                            {project.receiverSignature ? (
                                <Image src={project.receiverSignature} style={styles.firmaImg} />
                            ) : (
                                <Text style={{ fontSize: 8, color: '#aaa' }}>Sin firma</Text>
                            )}
                        </View>
                        <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 4 }}>Firma de quien recibe</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Brosma · Este documento es tu orden de trabajo. Consulta el avance de tu proyecto con el folio {project.folio}.
                </Text>
            </Page>
        </Document>
    )
}
