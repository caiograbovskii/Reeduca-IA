'use client'

// ============================================================
// Página de Aguardando Aprovação - Reeduca-IA
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AguardandoPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(false)
    const [debugInfo, setDebugInfo] = useState<string>('')

    // Verificar status imediatamente ao carregar a página
    useEffect(() => {
        checkStatus()
        // Verificar a cada 10 segundos
        const interval = setInterval(checkStatus, 10000)
        return () => clearInterval(interval)
    }, [])

    const checkStatus = async () => {
        try {
            const supabase = createClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) {
                setDebugInfo(`Erro ao buscar usuário: ${userError.message}`)
                return
            }

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_active, role')
                .eq('id', user.id)
                .single()

            if (profileError) {
                setDebugInfo(`Erro ao buscar perfil: ${profileError.message}`)
                return
            }

            setDebugInfo(`Perfil: role=${profile?.role}, is_active=${profile?.is_active}`)

            if (profile?.is_active || profile?.role === 'admin') {
                // Todos vão para o dashboard (admin tem botão especial lá)
                router.push('/dashboard')
            }
        } catch (err) {
            setDebugInfo(`Erro inesperado: ${err}`)
        }
    }

    const handleCheckNow = async () => {
        setChecking(true)
        await checkStatus()
        setChecking(false)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-light/20 to-white p-4">
            <div className="w-full max-w-md card animate-fade-in text-center">
                {/* Ícone de Relógio */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/20 mb-6">
                    <svg
                        className="w-10 h-10 text-secondary animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Aguardando Aprovação
                </h1>

                <p className="text-muted mb-6 leading-relaxed">
                    Seu cadastro foi realizado com sucesso! 🎉
                    <br /><br />
                    Agora, nossa equipe irá avaliar seus dados.
                    Em breve você receberá acesso ao sistema.
                </p>

                {/* Debug info - remover depois */}
                {debugInfo && (
                    <div className="bg-gray-100 rounded-xl p-3 mb-4 text-xs text-left font-mono">
                        {debugInfo}
                    </div>
                )}

                <div className="bg-primary-light/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-700">
                        <strong>💡 Dica:</strong> Esta página verifica automaticamente
                        a cada 10 segundos se sua conta foi ativada.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleCheckNow}
                        className="btn-secondary w-full"
                        disabled={checking}
                    >
                        {checking ? 'Verificando...' : 'Verificar Agora'}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="btn-outline w-full"
                    >
                        Sair da Conta
                    </button>
                </div>

                <p className="text-xs text-muted mt-6">
                    Dúvidas? Entre em contato com a Nutricionista Carla Dantas.
                </p>
            </div>
        </div>
    )
}
