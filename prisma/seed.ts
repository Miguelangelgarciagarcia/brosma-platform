import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function crearUsuario(email: string, password: string, name: string, role: 'admin' | 'trabajador') {
    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
        console.log(`Ya existe un usuario con ${email}, no se crea de nuevo.`)
        return
    }

    const hash = await bcrypt.hash(password, 12)

    await prisma.user.create({
        data: { name, email, password: hash, role },
    })

    console.log(`Usuario ${role} creado: ${email} / ${password}`)
}

async function main() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@brosma.local'
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'CambiaEstaPassword123!'
    await crearUsuario(adminEmail, adminPassword, 'Administrador', 'admin')

    // Usuario de prueba para poder asignar responsables en la Fase 3
    // (el módulo real de alta de usuarios llega en la Fase 6).
    const trabajadorEmail = process.env.SEED_TRABAJADOR_EMAIL || 'trabajador@brosma.local'
    const trabajadorPassword = process.env.SEED_TRABAJADOR_PASSWORD || 'CambiaEstaPassword123!'
    await crearUsuario(trabajadorEmail, trabajadorPassword, 'Trabajador de Prueba', 'trabajador')

    console.log('Cambien las contraseñas en cuanto inicien sesión la primera vez.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
