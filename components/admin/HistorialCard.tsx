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
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'var(--fg1)',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-hover)', fontFamily: 'monospace', marginBottom: '4px' }}>
                    {project.folio}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--fg2)' }}>
                    {project.clientName}
                    {project.company ? ` · ${project.company}` : ''}
                </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Entregado
                </div>
                <div style={{ fontSize: '13px' }}>{formatDate(project.deliveredAt)}</div>
            </div>
        </Link>
    )
}
