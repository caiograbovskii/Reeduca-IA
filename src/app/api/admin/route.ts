// ============================================================
// API de Admin - Listar e Gerenciar Usuários
// Roda no servidor para contornar RLS
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Criar cliente admin com service role (ignora RLS)
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas')
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
    try {
        const adminId = request.nextUrl.searchParams.get('adminId')

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID é obrigatório' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Verificar se é admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', adminId)
            .single()

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Buscar todos os usuários exceto o admin
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', adminId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar usuários:', error)
            return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
        }

        return NextResponse.json({ users })

    } catch (error) {
        console.error('Erro na API admin:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PATCH - Ativar/Desativar usuário
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { adminId, userId, isActive } = body

        if (!adminId || !userId || isActive === undefined) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Verificar se é admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', adminId)
            .single()

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Atualizar usuário
        const { error } = await supabase
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
