import { z } from 'zod'

// Subpunto: título corto + descripción larga, responsable, fechas, y sus
// propios hijos (recursivo -> profundidad infinita 1.1, 1.1.1, 1.1.1.1...).
export type SubpointInput = {
    title: string
    description?: string | null
    responsibleId: string
    startDate?: string | null
    endDate?: string | null
    children?: SubpointInput[]
}

const subpointSchema: z.ZodType<SubpointInput> = z.lazy(() =>
    z.object({
        title: z.string().trim().min(1, 'El título es requerido').max(120),
        description: z.string().max(4000).optional().nullable(),
        responsibleId: z.string().min(1, 'Selecciona un responsable'),
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
    responsibleId: z.string().min(1, 'Selecciona un responsable'),
    estimatedDays: z.coerce.number().int().min(0).max(365),
    children: z.array(subpointSchema).max(200).optional(),
})

export const createProjectSchema = z.object({
    recordStatus: z.enum(['borrador', 'registrado']).default('borrador'),

    title: z.string().trim().min(1, 'Describe brevemente el proyecto').max(160),

    clientName: z.string().trim().min(2).max(120),
    company: z.string().trim().max(120).optional().nullable(),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s()-]{7,20}$/, 'Teléfono inválido'),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')).nullable(),

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
