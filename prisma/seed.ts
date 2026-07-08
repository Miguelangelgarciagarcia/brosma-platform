import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@brosma.local'
    const password = process.env.SEED_ADMIN_PASSWORD || 'CambiaEstaPassword123!'

    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
        console.log(`Ya existe un usuario con ${email}, no se crea de nuevo.`)
        return
    }

    const hash = await bcrypt.hash(password, 12)

    await prisma.user.create({
        data: {
            name: 'Administrador',
            email,
            password: hash,
            role: 'admin',
        },
    })

    console.log('Usuario admin creado:')
    console.log(`  email:    ${email}`)
    console.log(`  password: ${password}`)
    console.log('Cámbiala en cuanto inicies sesión la primera vez.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
