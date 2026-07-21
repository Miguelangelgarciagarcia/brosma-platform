import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import CarruselHoy from '@/components/trabajo/CarruselHoy'
import PendientesFinalizadosTabs from '@/components/trabajo/PendientesFinalizadosTabs'
import { obtenerMiTrabajo } from '@/lib/mi-trabajo'

// "Mi trabajo": la misma vista que ve un Trabajador en /trabajo (Corriendo
// hoy, Pendientes, Finalizados, A mi cargo), pero dentro del panel de Admin
// (mismo AdminHeader/nav que Dashboard, Registrar, Historial y
// Configuración) — ahora que un Admin también puede quedar asignado como
// responsable de un punto o subpunto en los combobox, necesita un lugar
// para darle seguimiento a lo que se le asignó a él directamente. La
// consulta y el agrupado son exactamente los mismos que en /trabajo (ver
// lib/mi-trabajo.ts), solo cambia el header/hero alrededor.
export default async function AdminMiTrabajoPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    const {
        carrusel,
        pendientesPorProyecto,
        completadosPorProyecto,
        totalPendientes,
        totalCompletados,
        encargosPorProyecto,
        totalEncargos,
    } = await obtenerMiTrabajo(session.user.id)

    return (
        <main style={{ minHeight: '100vh', background: 'var(--admin-content-bg)' }}>
            <AdminHeader userName={session.user?.name} userEmail={session.user?.email} userRole={session.user?.role} />

            <section style={{ background: 'var(--admin-topbar-bg)', padding: '28px 20px 64px' }}>
                <div className="admin-fade-up" style={{ maxWidth: '860px', margin: '0 auto' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--admin-topbar-fg2)', margin: '0 0 4px' }}>
                        Mi trabajo
                    </p>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 4vw, 28px)', color: '#ffffff', margin: 0 }}>
                        Lo que tienes en puerta hoy
                    </h1>
                </div>
            </section>

            <div
                style={{
                    maxWidth: '860px',
                    margin: '-32px auto 0',
                    padding: '0 20px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                <section className="admin-content-card admin-fade-up admin-fade-delay-1" style={{ padding: '20px 22px' }}>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)', margin: '0 0 12px' }}>
                        Corriendo hoy ({carrusel.length})
                    </h2>
                    {carrusel.length === 0 ? (
                        <div
                            className="admin-subpanel"
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--admin-text-tertiary)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                            }}
                        >
                            No tienes nada agendado para hoy.
                        </div>
                    ) : (
                        <CarruselHoy fases={carrusel} />
                    )}
                </section>

                <div className="admin-fade-up admin-fade-delay-2">
                    <PendientesFinalizadosTabs
                        pendientes={pendientesPorProyecto}
                        completados={completadosPorProyecto}
                        totalPendientes={totalPendientes}
                        totalCompletados={totalCompletados}
                        aCargo={encargosPorProyecto}
                        totalACargo={totalEncargos}
                    />
                </div>
            </div>
        </main>
    )
}
