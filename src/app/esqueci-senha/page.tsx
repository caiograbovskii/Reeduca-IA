'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const supabase = createClient()

            // A URL de redirecionamento deve apontar para a página de redefinição
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/redefinir-senha`,
            })

            if (error) {
                // Tratamento de erros comuns
                if (error.message.includes('rate limit')) {
                    throw new Error('Muitas tentativas. Aguarde 60 segundos.')
                } else {
                    throw error
                }
            }

            setMessage({
                type: 'success',
                text: 'Se este e-mail estiver cadastrado, você receberá um link de recuperação em instantes.'
            })

        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'Erro ao enviar email. Tente novamente.'
            })
        } finally {
            setLoading(false)
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
                    <p className="text-muted mt-1">Informe seu email para receber o link</p>
                </div>

                <div className="card animate-fade-in">
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="label">
                                Email cadastrado
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

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading || (message?.type === 'success')}
                        >
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Voltar para o Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
