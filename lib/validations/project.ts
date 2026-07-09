import { z } from 'zod'

// Subpunto: título corto + descripción larga, responsable, fechas, y sus
// propios hijos (recursivo -> profundidad infinita 1.1, 1.1.1, 1.1.1.1...).
export type SubpointInput = {
    // Id real en la BD si ya existía (edición de un proyecto registrado, para
    // actualizar en vez de borrar+recrear y no perder progreso). Ausente en
    // subpuntos nuevos.
    id?: string
    title: string
    description?: string | null
    responsibleId: string
    startDate?: string | null
    endDate?: string | null
    children?: SubpointInput[]
}

// Forma "cruda" tal cual puede llegar en el body (antes de que los
// .default('') de abajo rellenen título/responsable). Es distinta de
// SubpointInput (la forma ya normalizada que se usa en el resto del código,
// después del parse) solo para que el tipado explícito del schema recursivo
// no truene contra los defaults.
type SubpointRawInput = {
    id?: string
    title?: string
    description?: string | null
    responsibleId?: string
    startDate?: string | null
    endDate?: string | null
    children?: SubpointRawInput[]
}

// Nota: título y responsable NO son obligatorios a nivel de schema porque
// "Guardar para seguir editando" debe poder guardar subpuntos a medio
// llenar (ej. el admin apenas agregó uno y quiere seguir después). Lo que
// sí es obligatorio para poder REGISTRAR el proyecto de forma definitiva
// se valida aparte, en el formulario, antes de mandar la petición.
const subpointSchema: z.ZodType<SubpointInput, z.ZodTypeDef, SubpointRawInput> = z.lazy(() =>
    z.object({
        id: z.string().optional(),
        title: z.string().trim().max(120).optional().default(''),
        description: z.string().max(4000).optional().nullable(),
        responsibleId: z.string().optional().default(''),
        startDate: z.string().datetime().optional().nullable(),
        endDate: z.string().datetime().optional().nullable(),
        children: z.array(subpointSchema).max(200).optional(),
    })
)

const mainPointSchema = z.object({
    mainPointKey: z.enum([
        'planeacion',
        'inicio_proyecto',
        'pruebas',
        'calidad',
        'listo_entrega',
        'entregado',
    ]),
    responsibleId: z.string().optional().default(''),
    estimatedDays: z.coerce.number().int().min(0).max(365),
    children: z.array(subpointSchema).max(200).optional(),
})

export const createProjectSchema = z.object({
    recordStatus: z.enum(['borrador', 'registrado']).default('borrador'),

    title: z.string().trim().min(1, 'Describe brevemente el proyecto').max(160),

    clientName: z.string().trim().min(2).max(120),
    company: z.string().trim().min(1, 'La empresa es requerida').max(120),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s()-]{7,20}$/, 'Teléfono inválido'),
    email: z.string().trim().toLowerCase().min(1, 'El correo es requerido').email('Correo inválido'),

    cost: z.coerce.number().min(0).optional().nullable(),
    advancePayment: z.coerce.number().min(0).optional().nullable(),
    paymentStatus: z.enum(['pendiente', 'anticipo', 'pagado']).default('pendiente'),

    notes: z.string().max(4000).optional().nullable(),

    clientSignature: z.string().max(2_000_000).optional().nullable(),
    receiverSignature: z.string().max(2_000_000).optional().nullable(),

    estimatedDeliveryManual: z.string().datetime().optional().nullable(),
    clientCanSeeSubpoints: z.boolean().default(false),

    mainPoints: z.array(mainPointSchema).length(6, 'Deben venir los 6 puntos principales'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
