// ============================================================
// API de Admin - Listar e Gerenciar Usuários
// Valida a sessão via cookies para segurança
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Criar cliente admin com service role (ignora RLS, usado para ler perfis de terceiros)
const getAdminSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Erro de configuração Supabase:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
        })
        throw new Error(`Configuração inválida: URL=${!!supabaseUrl}, Key=${!!supabaseServiceKey}`)
    }

    return createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
    try {
        // Obter cliente com sessão validada do cookie atual
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Cliente para rodar consultas admin bypassing RLS se necessário
        const adminSupabase = getAdminSupabaseClient()

        // Verificar se o usuário verificado no cookie de fato é admin
        const { data: adminProfile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Buscar todos os usuários exceto o admin
        const { data: users, error } = await adminSupabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar usuários:', error)
            return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
        }

        return NextResponse.json({ users })

    } catch (error: any) {
        console.error('Erro na API admin:', error)
        return NextResponse.json({
            error: `Erro técnico: ${error.message || 'Desconhecido'}`
        }, { status: 500 })
    }
}

// PATCH - Ativar/Desativar usuário
export async function PATCH(request: NextRequest) {
    try {
        // Obter cliente com sessão validada do cookie atual
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { userId, isActive } = body

        if (!userId || isActive === undefined) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const adminSupabase = getAdminSupabaseClient()

        // Verificar se é admin
        const { data: adminProfile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Atualizar usuário
        const { error } = await adminSupabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', userId)

        if (error) {
            console.error('Erro ao atualizar usuário:', error)
            return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erro na API admin:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
