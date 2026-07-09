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

// mainPointKey ya no es un enum fijo: el catálogo de puntos principales es
// configurable (ver lib/main-point-catalog.ts). "listo_entrega" y
// "entregado" siguen siendo las únicas 2 keys realmente fijas del sistema
// (se validan aparte, abajo, como reglas de posición). El título ahora lo
// manda el caller (viene del catálogo al crear, o del propio proyecto ya
// guardado al editar) en vez de derivarse de una tabla fija en el código.
const mainPointSchema = z.object({
    mainPointKey: z.string().trim().min(1),
    title: z.string().trim().min(1).max(120),
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

    // La cantidad de puntos principales ya no es fija (el catálogo es
    // configurable), pero los últimos 2 SIEMPRE deben ser "listo_entrega" y
    // "entregado", en ese orden exacto — esa es la única regla de forma que
    // se mantiene fija en todo el sistema.
    mainPoints: z
        .array(mainPointSchema)
        .min(3, 'Deben venir al menos 1 punto de trabajo más los 2 puntos fijos finales')
        .refine(
            (points) =>
                points.length >= 2 &&
                points[points.length - 2].mainPointKey === 'listo_entrega' &&
                points[points.length - 1].mainPointKey === 'entregado',
            { message: 'Los últimos 2 puntos deben ser "Listo para Entrega" y "Entregado", en ese orden' }
        ),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
