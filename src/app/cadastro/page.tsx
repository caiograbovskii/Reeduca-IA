'use client'

// ============================================================
// Página de Cadastro - Reeduca-IA
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        full_name: '',
        cpf: '',
        phone: '',
        address: '',
        email: '',
        password: '',
        confirm_password: '',
    })

    // Formatar CPF (000.000.000-00)
    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    // Formatar Telefone ((00) 00000-0000)
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        let formattedValue = value

        if (name === 'cpf') {
            formattedValue = formatCPF(value)
        } else if (name === 'phone') {
            formattedValue = formatPhone(value)
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }))
    }

    const validateForm = () => {
        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return false
        }
        if (formData.password !== formData.confirm_password) {
            setError('As senhas não coincidem.')
            return false
        }
        if (formData.cpf.replace(/\D/g, '').length !== 11) {
            setError('CPF inválido. Digite os 11 dígitos.')
            return false
        }
        if (formData.phone.replace(/\D/g, '').length < 10) {
            setError('Telefone inválido. Digite o número completo.')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!validateForm()) return

        setLoading(true)

        try {
            const supabase = createClient()

            // Registrar usuário no Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        cpf: formData.cpf.replace(/\D/g, ''), // Salva só números
                        phone: formData.phone,
                        address: formData.address,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (authError) {
                if (authError.message.includes('already registered')) {
                    setError('Este email já está cadastrado. Tente fazer login.')
                } else {
                    setError(authError.message)
                }
                return
            }

            if (data.user) {
                setSuccess(true)
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Tela de sucesso após cadastro
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-white p-4">
                <div className="w-full max-w-md card animate-fade-in text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
                        <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
                    <p className="text-muted mb-6">
                        Enviamos um email de confirmação para <strong>{formData.email}</strong>.
                        Por favor, verifique sua caixa de entrada e confirme seu cadastro.
                    </p>
                    <Link href="/login" className="btn-primary inline-block">
                        Voltar para Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-white p-4">
            <div className="w-full max-w-md">
                {/* Logo e Título */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
                    <p className="text-muted text-sm mt-1">Preencha seus dados para se cadastrar</p>
                </div>

                {/* Card de Cadastro */}
                <div className="card animate-fade-in">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="full_name" className="label">
                                Nome Completo *
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Maria da Silva"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="cpf" className="label">
                                    CPF *
                                </label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="label">
                                    Celular *
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="label">
                                Endereço *
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                value={formData.address}
                                onChange={handleChange}
                                className="input"
                                placeholder="Rua, número, bairro, cidade - UF"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="label">
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="seu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="label">
                                    Senha *
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="label">
                                    Confirmar Senha *
                                </label>
                                <input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Repita a senha"
                                    minLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full mt-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cadastrando...
                                </span>
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary font-semibold hover:underline">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
