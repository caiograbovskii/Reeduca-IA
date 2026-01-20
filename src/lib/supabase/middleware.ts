// ============================================================
// Middleware do Supabase para Next.js
// Gerencia sessão de autenticação
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        // Se não tiver configuração, deixa passar
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request,
    })

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
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

        // Rotas públicas (não requerem autenticação)
        const publicRoutes = ['/', '/login', '/cadastro']
        const isPublicRoute = publicRoutes.some(route =>
            request.nextUrl.pathname === route
        ) || request.nextUrl.pathname.startsWith('/auth/')

        // Rotas de API não passam pela verificação de sessão
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return response
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Se não está logado e não é rota pública, redireciona para login
        if (!user && !isPublicRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Se está logado, verifica se o usuário está ativo
        if (user && !isPublicRoute) {
            // Buscar perfil do usuário
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_active, role')
                .eq('id', user.id)
                .single()

            // Se houve erro na consulta, deixa passar (pode ser novo usuário)
            if (error || !profile) {
                return response
            }

            // Se o usuário não está ativo e não está na página de aguardando
            if (!profile.is_active && request.nextUrl.pathname !== '/aguardando') {
                const url = request.nextUrl.clone()
                url.pathname = '/aguardando'
                return NextResponse.redirect(url)
            }

            // Se está ativo mas tentando acessar página de aguardando, redireciona para dashboard
            if (profile.is_active && request.nextUrl.pathname === '/aguardando') {
                const url = request.nextUrl.clone()
                url.pathname = profile.role === 'admin' ? '/admin' : '/dashboard'
                return NextResponse.redirect(url)
            }

            // Se não é admin tentando acessar rotas de admin, bloqueia
            if (profile.role !== 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }

        return response
    } catch (error) {
        // Em caso de erro, deixa a requisição passar
        console.error('Middleware error:', error)
        return NextResponse.next()
    }
}
