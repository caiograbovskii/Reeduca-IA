// ============================================================
// Callback de Autenticação - Reeduca-IA
// Processa confirmação de email e redireciona
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const type = requestUrl.searchParams.get('type')
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // Se for confirmação de email, redireciona para página de sucesso
    if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/email-confirmado`)
    }

    // Caso padrão: redireciona para login
    return NextResponse.redirect(`${origin}/login`)
}
