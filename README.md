# Brosma - Plataforma de Gestión y Seguimiento

Next.js (App Router) + Prisma/Neon + NextAuth + Cloudinary + Resend.

## 1. Requisitos

- Node.js 20+
- Una cuenta de Neon (gratis): https://neon.tech
- Una cuenta de Resend (gratis): https://resend.com
- Una cuenta de Cloudinary (gratis, se usa a partir de la Fase 3): https://cloudinary.com

Durante desarrollo se usan cuentas **personales** de Neon/Resend. Al pasar a
producción solo se reemplazan las variables de entorno (nada de código
cambia).

## 2. Configuración local

```bash
npm install
cp .env.example .env.local
```

Abre `.env.local` y llena:

- `DATABASE_URL` y `DIRECT_DATABASE_URL`: en el dashboard de Neon, crea un
  proyecto, entra a "Connection Details" y copia:
  - la conexión **Pooled** → `DATABASE_URL`
  - la conexión **Direct** (sin `-pooler`) → `DIRECT_DATABASE_URL`
- `AUTH_SECRET`: genera uno con `openssl rand -base64 32` (o cualquier
  cadena aleatoria larga).
- `RESEND_API_KEY`: en el dashboard de Resend, API Keys → Create API Key.
- `RESEND_FROM`: mientras no verifiques un dominio propio en Resend, usa
  `onboarding@resend.dev` (Resend lo da de forma gratuita para pruebas).
- Cloudinary y Upstash se llenan en fases posteriores (3 y 5).

**Nunca subas `.env.local` a git** (ya está en `.gitignore`).

## 3. Base de datos

```bash
npm run db:push      # crea las tablas en Neon según prisma/schema.prisma
npm run db:seed       # crea un usuario admin de prueba
```

El seed crea `admin@brosma.local` / `CambiaEstaPassword123!` por defecto.
Puedes sobreescribirlo con las variables `SEED_ADMIN_EMAIL` y
`SEED_ADMIN_PASSWORD` en `.env.local` antes de correr el seed.

## 4. Levantar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

## 5. Estructura

```
app/            rutas (App Router)
  admin/        panel de administrador (Fase 2-3)
  trabajo/      panel de trabajador (Fase 4)
  seguimiento/  rastreo público por folio (Fase 5)
  login/        acceso interno
  api/          endpoints REST
components/     componentes de UI
lib/            auth, prisma, cloudinary, resend, rate limiting
prisma/         schema.prisma + seed
proxy.ts        protección de rutas /admin y /trabajo (equivalente a middleware.ts)
```

## 6. Seguridad (resumen)

- Contraseñas con bcrypt (cost 12), nunca texto plano.
- Bloqueo de cuenta tras 5 intentos fallidos (15 min).
- Sesiones JWT de 8 horas.
- Bitácora de auditoría (`AuditLog`) para logins y acciones sensibles.
- Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.) en `next.config.ts`.
- Rate limiting con Upstash para `/login` y `/seguimiento/[folio]` (se activa
  en la Fase 5; sin credenciales de Upstash, queda deshabilitado solo en dev).
- Toda validación de entrada se hace con Zod en el servidor (no solo en el
  cliente).
