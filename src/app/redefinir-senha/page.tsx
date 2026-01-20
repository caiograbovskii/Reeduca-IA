'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function RedefinirSenhaPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Verificar se existe uma sessão (usuário vê esta página após clicar no link do email)
    // O Supabase Auth magicamente loga o usuário quando ele clica no link de reset
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // Se não tiver sessão (link inválido ou expirado), redireciona
                // Mas as vezes o hash demora pra processar, então idealmente teriamos um loading state melhor
                // Por hora, vamos deixar o usuário tentar logar ou assumir que o link expirou
            }
        }
        checkSession()
    }, [])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
                <div className="card text-center max-w-md animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Atualizada!</h2>
                    <p className="text-gray-600 mb-6">Sua senha foi alterada com sucesso. Você será redirecionado para o painel.</p>
                    <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
                        Ir para o Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-white p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Image
                        src="/logo-colorida.png"
                        alt="Reeduca-IA"
                        width={150}
                        height={75}
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">Nova Senha</h1>
                    <p className="text-muted mt-1">Crie uma nova senha segura</p>
                </div>

                <div className="card animate-fade-in">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="label">
                                Nova Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirmar Nova Senha
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Atualizando...' : 'Definir Nova Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
