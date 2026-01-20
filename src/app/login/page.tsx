'use client'

// ============================================================
// Página de Login - Reeduca-IA
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                console.error('Erro de autenticação:', authError)
                if (authError.message.includes('Email not confirmed')) {
                    setError('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
                } else if (authError.message.includes('Invalid login credentials')) {
                    setError('Email ou senha incorretos. Tente novamente.')
                } else {
                    setError(`Erro: ${authError.message}`)
                }
                setLoading(false)
                return
            }

            if (data.user) {
                // Buscar perfil do usuário
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_active, role')
                    .eq('id', data.user.id)
                    .single()

                if (profileError) {
                    console.error('Erro ao buscar perfil:', profileError)
                    // Se não encontrou perfil, pode ser usuário novo - vai para aguardando
                    router.push('/aguardando')
                    return
                }

                if (profile && !profile.is_active) {
                    router.push('/aguardando')
                } else {
                    // Tanto admin quanto paciente vão para o dashboard
                    router.push('/dashboard')
                }
            }
        } catch (err: unknown) {
            console.error('Erro inesperado:', err)
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
            setError(`Erro ao conectar: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-white p-4">
            <div className="w-full max-w-md">
                {/* Logo e Título */}
                <div className="text-center mb-8">
                    <Image
                        src="/logo-colorida.png"
                        alt="Dra. Carla Dantas - Nutricionista"
                        width={180}
                        height={90}
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">Reeduca-IA</h1>
                    <p className="text-muted mt-1">Sua assistente nutricional</p>
                </div>

                {/* Card de Login */}
                <div className="card animate-fade-in">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                        Acesse sua conta
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="seu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted">
                            Não tem uma conta?{' '}
                            <Link href="/cadastro" className="text-primary font-semibold hover:underline">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted mt-8">
                    © 2024 Reeduca-IA. Todos os direitos reservados.
                </p>
            </div>
        </div>
    )
}
