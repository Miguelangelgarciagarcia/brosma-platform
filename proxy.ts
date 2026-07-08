import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Nota: en esta versión de Next.js el middleware se define en proxy.ts
// (antes era middleware.ts). Ver AGENTS.md / node_modules/next/dist/docs.
export default auth((req) => {
    const isLoggedIn = !!req.auth
    const role = req.auth?.user?.role
    const path = req.nextUrl.pathname

    const isAdminRoute = path.startsWith('/admin')
    const isTrabajoRoute = path.startsWith('/trabajo')

    if ((isAdminRoute || isTrabajoRoute) && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Un "trabajador" no puede entrar a rutas de /admin
    if (isAdminRoute && role !== 'admin') {
        return NextResponse.redirect(new URL('/trabajo', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/admin/:path*', '/trabajo/:path*'],
}
