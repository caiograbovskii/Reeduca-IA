// ============================================================
// Middleware do Supabase para Next.js
// Gerencia sessão de autenticação
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANTE: NÃO use await entre createServerClient e
    // supabase.auth.getUser(). Uma simples manutenção pode causar bugs
    // muito difíceis de depurar.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Rotas públicas (não requerem autenticação)
    const publicRoutes = ['/', '/login', '/cadastro', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith('/auth/')
    )

    // Se não está logado e não é rota pública, redireciona para login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Se está logado, verifica se o usuário está ativo
    if (user && !isPublicRoute) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_active, role')
            .eq('id', user.id)
            .single()

        // Se o usuário não está ativo e não está na página de aguardando
        if (profile && !profile.is_active && request.nextUrl.pathname !== '/aguardando') {
            const url = request.nextUrl.clone()
            url.pathname = '/aguardando'
            return NextResponse.redirect(url)
        }

        // Se está ativo mas tentando acessar página de aguardando, redireciona para dashboard
        if (profile && profile.is_active && request.nextUrl.pathname === '/aguardando') {
            const url = request.nextUrl.clone()
            url.pathname = profile.role === 'admin' ? '/admin' : '/dashboard'
            return NextResponse.redirect(url)
        }

        // Se não é admin tentando acessar rotas de admin, bloqueia
        if (profile && profile.role !== 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}
