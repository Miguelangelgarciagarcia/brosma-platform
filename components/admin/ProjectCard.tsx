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
    }
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const entrega = project.estimatedDeliveryManual ?? project.estimatedDeliveryAuto

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
                    {project.recordStatus === 'borrador' && (
                        <span style={{ marginLeft: '8px', color: '#e0a020' }}>· borrador</span>
                    )}
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
                    Entrega estimada
                </div>
                <div style={{ fontSize: '13px' }}>{formatDate(entrega)}</div>
            </div>
        </Link>
    )
}
