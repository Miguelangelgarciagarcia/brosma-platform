import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import UserForm from '@/components/admin/UserForm'
import MainPointCatalogManager from '@/components/admin/MainPointCatalogManager'
import { formatDate } from '@/lib/dates'
import { obtenerCatalogoCompleto } from '@/lib/main-point-catalog'

export default async function ConfiguracionPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    const usuarios = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    })

    const catalogoPuntos = await obtenerCatalogoCompleto()

    return (
        <main style={{ minHeight: '100vh', background: 'var(--brand-panel-bg)' }}>
            <AdminHeader userName={session.user?.name} userRole={session.user?.role} />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg)' }}>
                        Configuración
                    </h1>
                    <Link href="/cuenta" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-orange)', textDecoration: 'none' }}>
                        Cambiar mi contraseña →
                    </Link>
                </div>

                {/* auto-fit + minmax en vez de columnas fijas: en pantallas
                    angostas (celular) las dos columnas se apilan solas, sin
                    necesidad de una media query aparte. */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
                    <UserForm />

                    <div>
                        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg2)', marginBottom: '10px' }}>
                            Cuentas existentes ({usuarios.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {usuarios.map((u) => (
                                <div
                                    key={u.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'var(--brand-panel-card)',
                                        border: '1px solid var(--brand-panel-border)',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg)' }}>
                                            {u.name}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: 'var(--font-body)',
                                                fontSize: '12px',
                                                color: 'var(--brand-panel-fg2)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {u.email}
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
                                                background: u.role === 'admin' ? 'rgba(244,123,48,0.15)' : 'rgba(255,255,255,0.06)',
                                                color: u.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-panel-fg3)',
                                            }}
                                        >
                                            {u.role}
                                        </span>
                                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--brand-panel-fg3)', marginTop: '4px' }}>
                                            desde {formatDate(u.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--brand-panel-fg2)', marginBottom: '10px' }}>
                        Puntos principales de proyectos nuevos
                    </h2>
                    <MainPointCatalogManager initial={catalogoPuntos} />
                </div>
            </div>
        </main>
    )
}
