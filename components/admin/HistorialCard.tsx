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

// Mismo ícono de check que usa el stat card "Entregados" del dashboard
// (app/admin/page.tsx), para que la fila del historial se sienta parte de
// la misma familia visual en vez de un componente aparte.
function IconEntregado() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
        </svg>
    )
}

export default function HistorialCard({ project }: HistorialCardProps) {
    return (
        <Link
            href={`/admin/proyecto/${project.folio}`}
            className="admin-content-card admin-history-row"
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'var(--admin-text-primary)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'var(--admin-icon-navy-bg)',
                        color: 'var(--admin-icon-navy-fg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <IconEntregado />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--brand-orange)', marginBottom: '4px' }}>
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
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                        {project.clientName}
                        {project.company ? ` · ${project.company}` : ''}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'var(--admin-text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}
                >
                    Entregado
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                    {formatDate(project.deliveredAt)}
                </div>
            </div>
        </Link>
    )
}
