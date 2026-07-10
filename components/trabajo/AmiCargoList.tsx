// Vista de solo lectura: puntos principales de los que el usuario actual es
// encargado, con el desglose de quién es responsable de cada subpunto
// debajo. A propósito no tiene ninguna acción (ni Iniciar ni Terminar): ser
// "encargado" de un punto principal ya no da permiso de operarlo a mano, eso
// le toca a quien esté asignado a cada subpunto individual (y solo desde su
// propia pestaña "Pendientes", si ese subpunto es suyo).
type SubpuntoACargo = { id: string; label: string; title: string; status: string; responsableName: string; atrasado: boolean }
type PuntoACargo = { id: string; label: string; title: string; status: string; atrasado: boolean; subpuntos: SubpuntoACargo[] }
type GrupoACargo = { folio: string; title: string; clientName: string; puntos: PuntoACargo[] }

function estatusBadge(status: string) {
    return {
        background:
            status === 'completado' ? 'rgba(255,255,255,0.14)' : status === 'en_proceso' ? 'rgba(244,123,48,0.18)' : 'rgba(255,255,255,0.06)',
        color: status === 'completado' ? '#ffffff' : status === 'en_proceso' ? 'var(--brand-orange)' : 'var(--brand-panel-fg3)',
        label: status === 'completado' ? 'Completado' : status === 'en_proceso' ? 'En proceso' : 'Pendiente',
    }
}

export default function AmiCargoList({ grupos }: { grupos: GrupoACargo[] }) {
    if (grupos.length === 0) {
        return (
            <div
                style={{
                    background: 'var(--brand-panel-card)',
                    border: '1px solid var(--brand-panel-border)',
                    borderRadius: '10px',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--brand-panel-fg3)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                }}
            >
                No eres encargado de ningún punto principal por ahora.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {grupos.map((grupo) => (
                <div
                    key={grupo.folio}
                    style={{
                        background: 'var(--brand-panel-card)',
                        border: '1px solid var(--brand-panel-border)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand-orange)' }}>{grupo.folio}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--brand-panel-fg)' }}>
                            {grupo.title}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)' }}>{grupo.clientName}</div>
                    </div>

                    {grupo.puntos.map((punto) => {
                        const badge = estatusBadge(punto.status)
                        return (
                            <div
                                key={punto.id}
                                style={{
                                    border: '1px solid var(--brand-panel-border)',
                                    borderLeft: '3px solid var(--brand-orange)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    animation: punto.atrasado ? 'brandBlinkAtraso 1.4s ease-in-out infinite' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg)' }}>
                                        {punto.label}. {punto.title}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        {punto.atrasado && (
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    fontFamily: 'var(--font-body)',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    color: '#ff6b6b',
                                                    background: 'rgba(255,107,107,0.14)',
                                                    borderRadius: '999px',
                                                    padding: '2px 8px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        background: '#ff3b3b',
                                                        flexShrink: 0,
                                                        animation: 'brandBlinkDot 1s ease-in-out infinite',
                                                    }}
                                                />
                                                Atrasado
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-body)',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                background: badge.background,
                                                color: badge.color,
                                            }}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>
                                </div>

                                {punto.subpuntos.length === 0 ? (
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-panel-fg3)', margin: 0 }}>
                                        Todavía no tiene subpuntos.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {punto.subpuntos.map((sp) => {
                                            const spBadge = estatusBadge(sp.status)
                                            return (
                                                <div
                                                    key={sp.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 8px',
                                                        borderRadius: '6px',
                                                        border: sp.atrasado ? '1px solid #ff6b6b' : '1px solid transparent',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        animation: sp.atrasado ? 'brandBlinkAtraso 1.4s ease-in-out infinite' : 'none',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily: 'var(--font-body)',
                                                            fontSize: '12px',
                                                            color: 'var(--brand-panel-fg2)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {sp.label} {sp.title} · <span style={{ color: 'var(--brand-panel-fg3)' }}>{sp.responsableName}</span>
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontFamily: 'var(--font-body)',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            padding: '2px 8px',
                                                            borderRadius: '999px',
                                                            flexShrink: 0,
                                                            background: spBadge.background,
                                                            color: spBadge.color,
                                                        }}
                                                    >
                                                        {spBadge.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
