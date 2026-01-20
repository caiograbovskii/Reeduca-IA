'use client'

// ============================================================
// Modal para Adicionar Cardápio - Reeduca-IA
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Menu } from '@/types'

interface AddMenuModalProps {
    userId: string
    onClose: () => void
    onMenuAdded: (menu: Menu) => void
}

export default function AddMenuModal({ userId, onClose, onMenuAdded }: AddMenuModalProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim() || !content.trim()) {
            setError('Preencha todos os campos')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()

            const { data, error: insertError } = await supabase
                .from('menus')
                .insert({
                    user_id: userId,
                    title: title.trim(),
                    content_text: content.trim(),
                })
                .select()
                .single()

            if (insertError) {
                setError(insertError.message)
                return
            }

            if (data) {
                onMenuAdded(data)
            }
        } catch (err) {
            setError('Erro ao salvar cardápio')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-secondary to-secondary-dark">
                    <div>
                        <h2 className="text-xl font-bold text-white">Adicionar Cardápio</h2>
                        <p className="text-sm text-white/80 mt-1">Cole o texto do seu cardápio nutricional</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="label">Nome do Cardápio</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input"
                            placeholder="Ex: Cardápio Semana 1, Plano Emagrecimento..."
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="label">Conteúdo do Cardápio</label>
                        <p className="text-xs text-muted mb-2">
                            Cole aqui todo o texto do seu cardápio. A IA vai usar isso para responder suas dúvidas.
                        </p>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input min-h-[300px] resize-y"
                            placeholder={`Exemplo:

CAFÉ DA MANHÃ (7h)
- 2 fatias de pão integral
- 1 colher de sopa de pasta de amendoim
- 1 copo de leite desnatado
- 1 fruta

LANCHE DA MANHÃ (10h)
- 1 iogurte natural
- 1 colher de aveia

ALMOÇO (12h30)
...`}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-outline"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-secondary"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Cardápio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
