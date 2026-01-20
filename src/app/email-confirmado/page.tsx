// ============================================================
// Página de Email Confirmado - Reeduca-IA
// ============================================================

import Link from 'next/link'

export default function EmailConfirmadoPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/30 via-white to-secondary-light/20 p-4">
            <div className="w-full max-w-md text-center animate-fade-in">
                {/* Ícone de Sucesso */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6 shadow-xl shadow-green-500/30">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Card */}
                <div className="card">
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        Email Confirmado! 🎉
                    </h1>

                    <p className="text-muted mb-6 leading-relaxed">
                        Seu email foi confirmado com sucesso! Agora seu cadastro está
                        aguardando aprovação da <strong>Nutricionista Carla Dantas</strong>.
                    </p>

                    {/* Info Box */}
                    <div className="bg-secondary/10 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-secondary-dark text-sm">Próximo passo:</p>
                                <p className="text-sm text-gray-600">
                                    Faça login para acompanhar o status da sua aprovação.
                                    Você receberá acesso assim que for aprovado!
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>Ir para o Login</span>
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-xs text-muted mt-6">
                    © 2024 Reeduca-IA • Nutricionista Carla Dantas
                </p>
            </div>
        </div>
    )
}
