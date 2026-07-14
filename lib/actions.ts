'use server'

import { signOut } from '@/lib/auth'

// Server action de cierre de sesión, extraída a su propio módulo (en vez de
// definirse inline dentro de AdminHeader) porque AdminHeader ahora también
// se renderiza desde componentes cliente (ProyectoForm, para la pantalla de
// Registrar/editar borrador). Next.js no permite definir una server action
// inline dentro de un archivo que termina empaquetado como Client Component;
// importar una acción ya declarada en un módulo "use server" sí funciona en
// ambos casos (Server Component o Client Component).
export async function signOutAction() {
    await signOut({ redirectTo: '/login' })
}
