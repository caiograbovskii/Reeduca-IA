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
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error('Erro ao confirmar email no callback:', error.message)
            return NextResponse.redirect(`${origin}/login?error=O+link+de+confirmação+de+e-mail+falhou,+é+inválido+ou+expirou.+Tente+fazer+o+login+novamente+para+enviarmos+outro.`)
        }
    } else if (requestUrl.searchParams.get('error')) {
        // Trata erros que já vêm direto da URL do Supabase
        const errorDesc = requestUrl.searchParams.get('error_description') || 'Erro de autenticação desconhecido.'
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc)}`)
    }

    // Se for confirmação de email, redireciona para página de sucesso
    if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/email-confirmado`)
    }

    // Caso padrão: redireciona para login
    return NextResponse.redirect(`${origin}/login`)
}
