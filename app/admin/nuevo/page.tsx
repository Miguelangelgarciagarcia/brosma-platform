import ProyectoForm from '@/components/admin/ProyectoForm'
import { obtenerPuntosParaNuevoProyecto } from '@/lib/main-point-catalog'

export default async function NuevoProyectoPage() {
    // Catálogo configurable de Puntos Principales (ver Configuración): se lee
    // una sola vez aquí y se copia al formulario. A partir de ese momento el
    // proyecto queda independiente de cambios futuros en el catálogo.
    const catalogoPuntos = await obtenerPuntosParaNuevoProyecto()
    return <ProyectoForm mode="crear" catalogoPuntos={catalogoPuntos} />
}
