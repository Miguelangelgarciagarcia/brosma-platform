import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Se activa solo si hay credenciales de Upstash configuradas (Fase 5+).
// Mientras tanto, `limiters` queda null y los endpoints deben tratarlo
// como "sin límite" en desarrollo, pero es OBLIGATORIO configurarlo antes
// de producción (login y seguimiento público son los objetivos típicos
// de fuerza bruta).
const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null

// 5 intentos de login por minuto por IP
export const loginRateLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 m'),
          prefix: 'ratelimit:login',
      })
    : null

// 10 consultas de folio por minuto por IP (evita fuerza bruta de folios)
export const trackingRateLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 m'),
          prefix: 'ratelimit:seguimiento',
      })
    : null

export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; remaining?: number }> {
    if (!limiter) return { success: true } // sin Upstash configurado (solo dev)
    const result = await limiter.limit(identifier)
    return { success: result.success, remaining: result.remaining }
}
