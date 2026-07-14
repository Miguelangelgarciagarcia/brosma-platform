import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import UserForm from '@/components/admin/UserForm'
import MainPointCatalogManager from '@/components/admin/MainPointCatalogManager'
import { formatDate } from '@/lib/dates'
import { obtenerCatalogoCompleto } from '@/lib/main-point-catalog'

// Iconos de línea (mismos que en el dashboard/historial: sin librería
// externa, un color por módulo para que Usuarios y Puntos principales se
// distingan de un vistazo aunque compartan la misma pestaña).
function IconUsuarios() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

function IconPuntos() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22V4a1 1 0 0 1 1-1h13.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13" />
        </svg>
    )
}

export default async function ConfiguracionPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    const usuarios = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    })

    const catalogoPuntos = await obtenerCatalogoCompleto()

    // Derivado del catálogo ya traído arriba (nada de queries nuevas): solo
    // para el stat card de "Puntos activos".
    const puntosActivos = catalogoPuntos.filter((p) => !p.fixed && p.active).length

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />

            {/* Hero navy: mismo patrón que dashboard/historial. */}
            <section
                style={{
                    background: 'var(--admin-topbar-bg)',
                    padding: '28px 20px 64px',
                }}
            >
                <div
                    className="admin-fade-up"
                    style={{
                        maxWidth: '1180px',
                        margin: '0 auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '16px',
                    }}
                >
                    <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '0 0 4px' }}>
                            Configuración
                        </p>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 32px)', color: '#ffffff', margin: 0 }}>
                            Usuarios y catálogo
                        </h1>
                    </div>

                    <Link
                        href="/cuenta"
                        className="admin-fade-up admin-fade-delay-1"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: 'var(--brand-orange)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '11px 18px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Cambiar mi contraseña →
                    </Link>
                </div>
            </section>

            <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 20px 40px' }}>
                {/* Stat cards superpuestos, igual que en dashboard/historial. */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginTop: '-44px',
                        marginBottom: '32px',
                    }}
                >
                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--admin-icon-navy-bg)',
                                color: 'var(--admin-icon-navy-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconUsuarios />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                Cuentas registradas
                            </p>
                            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, color: 'var(--admin-text-primary)' }}>
                                {usuarios.length}
                            </p>
                        </div>
                    </div>

                    <div className="admin-stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--admin-icon-orange-bg)',
                                color: 'var(--admin-icon-orange-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconPuntos />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '0 0 2px' }}>
                                Puntos activos
                            </p>
                            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, color: 'var(--admin-text-primary)' }}>
                                {puntosActivos}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Los dos módulos van lado a lado en escritorio (grid con
                    auto-fit + minmax de 420px) para aprovechar el ancho de
                    la pantalla, y se apilan solos en móvil sin necesidad de
                    una media query aparte. Ojo: minmax(420px, 1fr) a secas
                    desborda en celulares más angostos que 420px (el track
                    no puede encogerse más allá del mínimo) — por eso el
                    mínimo real es min(420px, 100%), que se limita solo al
                    ancho disponible cuando la pantalla es más chica. */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: '24px', alignItems: 'stretch' }}>
                {/* Módulo 1: Usuarios — acento navy, para distinguirse del
                    módulo de al lado aunque ambos compartan la misma pestaña. */}
                <section
                    className="admin-content-card admin-fade-up admin-fade-delay-2"
                    style={{ padding: '22px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'var(--admin-icon-navy-bg)',
                                color: 'var(--admin-icon-navy-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconUsuarios />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                                Usuarios
                            </h2>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', margin: 0, color: 'var(--admin-text-secondary)' }}>
                                Cuentas de acceso al panel interno
                            </p>
                        </div>
                    </div>

                    {/* auto-fit + minmax en vez de columnas fijas: en pantallas
                        angostas (celular) las dos columnas se apilan solas, sin
                        necesidad de una media query aparte. min(280px, 100%)
                        por la misma razón que el grid de arriba: en celulares
                        angostos (320px), 280px de mínimo más el padding de la
                        tarjeta ya no cabe y desborda. */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '18px', alignItems: 'start' }}>
                        <UserForm />

                        <div>
                            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>
                                Cuentas existentes ({usuarios.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {usuarios.map((u) => {
                                    const iniciales = u.name
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((w) => w[0]?.toUpperCase())
                                        .join('')
                                    return (
                                        <div
                                            key={u.id}
                                            className="admin-subpanel"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: u.role === 'admin' ? 'var(--admin-icon-orange-bg)' : 'var(--admin-icon-navy-bg)',
                                                        color: u.role === 'admin' ? 'var(--admin-icon-orange-fg)' : 'var(--admin-icon-navy-fg)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontFamily: 'var(--font-body)',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {iniciales}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                                        {u.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: 'var(--font-body)',
                                                            fontSize: '12px',
                                                            color: 'var(--admin-text-secondary)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <span
                                                    style={{
                                                        fontFamily: 'var(--font-body)',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '999px',
                                                        background: u.role === 'admin' ? 'var(--admin-icon-orange-bg)' : '#ffffff',
                                                        border: u.role === 'admin' ? 'none' : '1px solid var(--admin-card-border)',
                                                        color: u.role === 'admin' ? 'var(--brand-orange)' : 'var(--admin-text-tertiary)',
                                                    }}
                                                >
                                                    {u.role}
                                                </span>
                                                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--admin-text-tertiary)', marginTop: '4px' }}>
                                                    desde {formatDate(u.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Módulo 2: Puntos principales — acento naranja, para que se
                    lea como un módulo distinto del de Usuarios de al lado. */}
                <section
                    className="admin-content-card admin-fade-up admin-fade-delay-3"
                    style={{ padding: '22px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'var(--admin-icon-orange-bg)',
                                color: 'var(--admin-icon-orange-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconPuntos />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                                Puntos principales
                            </h2>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', margin: 0, color: 'var(--admin-text-secondary)' }}>
                                Plantilla que se copia al crear un proyecto nuevo
                            </p>
                        </div>
                    </div>

                    <MainPointCatalogManager initial={catalogoPuntos} />
                </section>
                </div>
            </div>
        </main>
    )
}
