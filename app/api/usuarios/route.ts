import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Lista de usuarios internos (para asignar responsables, gestionar cuentas, etc).
// Solo Admin puede ver el listado completo.
export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const usuarios = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json(usuarios)
}
