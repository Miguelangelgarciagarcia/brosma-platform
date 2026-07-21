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

    // Cuentas de seed (admin/trabajador de arranque): se marcan verificadas
    // de una vez, porque no hay forma de que reciban ni den clic a un
    // correo de verificación en este flujo.
    await prisma.user.create({
        data: { name, email, password: hash, role, emailVerified: new Date() },
    })

    console.log(`Usuario ${role} creado: ${email} / ${password}`)
}

async function crearMainPointTemplateSiNoExiste(key: string, label: string, order: number, fixed: boolean) {
    const existe = await prisma.mainPointTemplate.findUnique({ where: { key } })
    if (existe) {
        console.log(`Ya existe el punto de catálogo "${key}", no se crea de nuevo.`)
        return
    }

    await prisma.mainPointTemplate.create({ data: { key, label, order, fixed } })
    console.log(`Punto de catálogo creado: ${label} (${key})`)
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

    // Catálogo inicial de Puntos Principales: los mismos 4 configurables que
    // ya existían (mismas keys, para que proyectos ya creados sigan
    // encajando) más los 2 fijos, siempre al final (order muy alto).
    await crearMainPointTemplateSiNoExiste('planeacion', 'Planeación', 1, false)
    await crearMainPointTemplateSiNoExiste('inicio_proyecto', 'Inicio de Proyecto', 2, false)
    await crearMainPointTemplateSiNoExiste('pruebas', 'Pruebas', 3, false)
    await crearMainPointTemplateSiNoExiste('calidad', 'Calidad', 4, false)
    await crearMainPointTemplateSiNoExiste('listo_entrega', 'Listo para Entrega', 9000, true)
    await crearMainPointTemplateSiNoExiste('entregado', 'Entregado', 9001, true)

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
