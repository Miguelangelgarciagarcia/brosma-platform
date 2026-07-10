import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProyectoForm from '@/components/admin/ProyectoForm'
import { obtenerPuntosParaNuevoProyecto } from '@/lib/main-point-catalog'

// Esta página no tenía chequeo de sesión (a diferencia de todas sus
// hermanas bajo /admin), lo cual además de ser un hueco de seguridad hacía
// que Next.js pudiera pre-renderla como estática en el build de producción
// (no llamaba a ninguna función dinámica como cookies()/auth()): el
// catálogo de Puntos Principales quedaba "congelado" con lo que hubiera en
// la base de datos al momento del build, y nunca se volvía a leer en
// requests posteriores aunque Configuración sí mostrara los cambios
// (porque esa página sí llama a auth()). Por eso "Crear nuevo proyecto"
// mostraba un catálogo viejo/desactualizado.
export default async function NuevoProyectoPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user?.role !== 'admin') redirect('/trabajo')

    // Catálogo configurable de Puntos Principales (ver Configuración): se lee
    // una sola vez aquí y se copia al formulario. A partir de ese momento el
    // proyecto queda independiente de cambios futuros en el catálogo.
    const catalogoPuntos = await obtenerPuntosParaNuevoProyecto()
    return <ProyectoForm mode="crear" catalogoPuntos={catalogoPuntos} />
}
