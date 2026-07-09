import Link from 'next/link'
import { formatDate } from '@/lib/dates'

type HistorialCardProps = {
    project: {
        folio: string
        title: string
        clientName: string
        company: string | null
        deliveredAt: Date | null
    }
}

export default function HistorialCard({ project }: HistorialCardProps) {
    return (
        <Link
            href={`/admin/proyecto/${project.folio}`}
            className="brand-panel-card"
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--brand-panel-card)',
                border: '1px solid var(--brand-panel-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'var(--brand-panel-fg)',
                transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--brand-orange)', marginBottom: '4px' }}>
                    {project.folio}
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
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'var(--brand-panel-fg3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}
                >
                    Entregado
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-panel-fg)' }}>
                    {formatDate(project.deliveredAt)}
                </div>
            </div>
        </Link>
    )
}
