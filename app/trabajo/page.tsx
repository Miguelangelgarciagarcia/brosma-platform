import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CarruselHoy from '@/components/trabajo/CarruselHoy'
import PendientesFinalizadosTabs from '@/components/trabajo/PendientesFinalizadosTabs'
import { hoyUTC } from '@/lib/dates'

type FaseConProyecto = {
    id: string
    title: string
    description: string | null
    status: string
    startDate: Date | string | null
    endDate: Date | string | null
    project: { folio: string; title: string; clientName: string }
    parent: { title: string } | null
}

type FaseConFlags = FaseConProyecto & { trabajando: boolean; retrasado: boolean }

// Del más cercano (fecha de fin más próxima) al más lejano. Los que no
// tienen fecha de fin capturada se van hasta el final.
function ordenarPorCercania(fases: FaseConFlags[]): FaseConFlags[] {
    return [...fases].sort((a, b) => {
        const da = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const db = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return da - db
    })
}

function agruparPorProyecto(fases: FaseConFlags[]) {
    const grupos = new Map<string, { folio: string; title: string; clientName: string; fases: FaseConFlags[] }>()
    for (const f of fases) {
        const key = f.project.folio
        if (!grupos.has(key)) {
            grupos.set(key, { folio: f.project.folio, title: f.project.title, clientName: f.project.clientName, fases: [] })
        }
        grupos.get(key)!.fases.push(f)
    }
    return Array.from(grupos.values())
}

export default async function TrabajoPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const fasesRaw = await prisma.phase.findMany({
        where: { responsibleId: session.user.id },
        include: {
            project: { select: { folio: true, title: true, clientName: true } },
            parent: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' },
    }) as FaseConProyecto[]

    const hoy = hoyUTC()

    const esHoy = (f: FaseConProyecto) =>
        f.status !== 'completado' &&
        !!f.startDate &&
        !!f.endDate &&
        new Date(f.startDate) <= hoy &&
        hoy <= new Date(f.endDate)

    const esRetrasado = (f: FaseConProyecto) =>
        f.status !== 'completado' && !!f.endDate && new Date(f.endDate) < hoy

    const fases: FaseConFlags[] = fasesRaw.map((f) => ({
        ...f,
        trabajando: f.status === 'en_proceso',
        retrasado: esRetrasado(f),
    }))

    // "Corriendo hoy" no es solo lo que cae hoy en el calendario: también
    // aquí aparece cualquier punto atrasado (de ayer o de días anteriores)
    // que ni siquiera se ha marcado como iniciado, para que no se pierda de
    // vista.
    const carrusel = ordenarPorCercania(fases.filter((f) => f.status !== 'completado' && (esHoy(f) || f.retrasado)))

    const pendientes = ordenarPorCercania(fases.filter((f) => f.status !== 'completado'))
    const completados = fases.filter((f) => f.status === 'completado')

    const pendientesPorProyecto = agruparPorProyecto(pendientes)
    const completadosPorProyecto = agruparPorProyecto(completados)

    return (
        <main style={{ minHeight: '100vh' }}>
            <div
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '16px' }}>Brosma</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fg2)' }}>{session.user?.name}</span>
                    <Link href="/cuenta" style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                        Mi cuenta
                    </Link>
                    <form
                        action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/login' })
                        }}
                    >
                        <button
                            type="submit"
                            style={{ fontSize: '12px', color: 'var(--fg2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Salir
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
                        ¡Bienvenido, {session.user?.name?.split(' ')[0]}!
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--fg3)', margin: 0 }}>
                        Esto es lo que tienes en puerta hoy.
                    </p>
                </div>

                <div>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '10px' }}>
                        Corriendo hoy ({carrusel.length})
                    </h2>
                    {carrusel.length === 0 ? (
                        <div
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--fg3)',
                                fontSize: '13px',
                            }}
                        >
                            No tienes nada agendado para hoy.
                        </div>
                    ) : (
                        <CarruselHoy fases={carrusel} />
                    )}
                </div>

                <PendientesFinalizadosTabs
                    pendientes={pendientesPorProyecto}
                    completados={completadosPorProyecto}
                    totalPendientes={pendientes.length}
                    totalCompletados={completados.length}
                />
            </div>
        </main>
    )
}
