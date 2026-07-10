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
            className="brand-panel-card"
            style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                // El "coloreado" según avance: un relleno de izquierda a
                // derecha (naranja tenue) que crece con el % — se nota el
                // avance de un vistazo sin tener que leer el número.
                background: `linear-gradient(90deg, rgba(244,123,48,0.16) ${project.progreso}%, var(--brand-panel-card) ${project.progreso}%)`,
                border: '1px solid var(--brand-panel-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'var(--brand-panel-fg)',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                animation: project.atrasado ? 'brandBlinkAtraso 1.4s ease-in-out infinite' : 'none',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--brand-orange)', marginBottom: '4px' }}>
                    {project.folio}
                    {project.recordStatus === 'borrador' && (
                        <span style={{ marginLeft: '8px', color: 'var(--brand-panel-fg3)', fontFamily: 'var(--font-body)' }}>
                            · borrador
                        </span>
                    )}
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {project.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-panel-fg2)' }}>
                    {project.clientName}
                    {project.company ? ` · ${project.company}` : ''}
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
                            color: '#ff6b6b',
                            letterSpacing: '0.06em',
                            marginBottom: '2px',
                        }}
                    >
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#ff3b3b',
                                flexShrink: 0,
                                animation: 'brandBlinkDot 1s ease-in-out infinite',
                            }}
                        />
                        PROYECTO ATRASADO
                    </div>
                )}
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'var(--brand-panel-fg3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}
                >
                    Entrega estimada
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg)' }}>
                    {formatDate(entrega)}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--brand-panel-fg3)', marginTop: '2px' }}>
                    {project.progreso}% avance
                </div>
            </div>
        </Link>
    )
}
