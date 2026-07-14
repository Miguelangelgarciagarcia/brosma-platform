import Link from 'next/link'
import { formatDate } from '@/lib/dates'

type ProjectCardProps = {
    project: {
        folio: string
        title: string
        clientName: string
        company: string | null
        recordStatus: string
        estimatedDeliveryManual: Date | null
        estimatedDeliveryAuto: Date | null
        // % de avance (0-100) y si algún punto/subpunto ya se pasó de fecha
        // sin iniciar o sin terminar — ver lib/progreso.ts.
        progreso: number
        atrasado: boolean
    }
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const entrega = project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto

    return (
        <Link
            href={`/admin/proyecto/${project.folio}`}
            className="admin-content-card admin-project-row"
            style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 18px',
                textDecoration: 'none',
                color: 'var(--admin-text-primary)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                borderColor: project.atrasado ? '#f3b3b2' : undefined,
                animation: project.atrasado ? 'brandBlinkAtrasoLight 1.6s ease-in-out infinite' : 'none',
            }}
        >
            <div style={{ minWidth: 0, flex: 1 }}>
                <div
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--brand-orange)',
                        marginBottom: '4px',
                    }}
                >
                    {project.folio}
                    {project.recordStatus === 'borrador' && (
                        <span style={{ marginLeft: '8px', color: 'var(--admin-text-tertiary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                            · borrador
                        </span>
                    )}
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--admin-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {project.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '10px' }}>
                    {project.clientName}
                    {project.company ? ` · ${project.company}` : ''}
                </div>

                {/* Barra de progreso: mismo % que antes (calcularProgreso),
                    ahora como barra explícita en vez de gradiente de fondo,
                    para que se lea bien sobre un card blanco. */}
                <div
                    style={{
                        height: '6px',
                        borderRadius: '999px',
                        background: '#eef1f4',
                        overflow: 'hidden',
                        maxWidth: '320px',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${project.progreso}%`,
                            borderRadius: '999px',
                            background: 'var(--brand-orange)',
                        }}
                    />
                </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {project.atrasado && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '5px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--admin-icon-red-fg)',
                            letterSpacing: '0.06em',
                            marginBottom: '4px',
                        }}
                    >
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: 'var(--admin-icon-red-fg)',
                                flexShrink: 0,
                                animation: 'brandBlinkDot 1s ease-in-out infinite',
                            }}
                        />
                        ATRASADO
                    </div>
                )}
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'var(--admin-text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}
                >
                    Entrega estimada
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                    {formatDate(entrega)}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--admin-text-tertiary)', marginTop: '2px' }}>
                    {project.progreso}% avance
                </div>
            </div>
        </Link>
    )
}
