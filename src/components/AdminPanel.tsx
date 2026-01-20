'use client'

// ============================================================
// Componente Painel do Administrador - Reeduca-IA
// Modal com gerenciamento de usuários
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AdminPanelProps {
    onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<Profile[]>([])
    const [activating, setActivating] = useState<string | null>(null)
    const [filter, setFilter] = useState<'pending' | 'active' | 'all'>('pending')

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        const supabase = createClient()

        // Buscar todos os usuários (exceto o próprio admin)
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user?.id || '')
            .order('created_at', { ascending: false })

        if (data) {
            setUsers(data)
        }
        setLoading(false)
    }

    const handleActivate = async (userId: string, activate: boolean) => {
        setActivating(userId)
        const supabase = createClient()

        const { error } = await supabase
            .from('profiles')
            .update({ is_active: activate })
            .eq('id', userId)

        if (!error) {
            setUsers(prev =>
                prev.map(u => u.id === userId ? { ...u, is_active: activate } : u)
            )
        }
        setActivating(null)
    }

    const filteredUsers = users.filter(u => {
        if (filter === 'pending') return !u.is_active
        if (filter === 'active') return u.is_active
        return true
    })

    const pendingCount = users.filter(u => !u.is_active).length
    const activeCount = users.filter(u => u.is_active).length

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Painel do Administrador</h2>
                        <p className="text-sm text-muted mt-1">Gerencie os pacientes cadastrados</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cards de Estatísticas */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
                                    <p className="text-xs text-muted">Pendentes</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{activeCount}</p>
                                    <p className="text-xs text-muted">Ativos</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{users.length}</p>
                                    <p className="text-xs text-muted">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="px-6 pt-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending'
                                ? 'bg-warning text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pendentes ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'active'
                                ? 'bg-success text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Ativos ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({users.length})
                        </button>
                    </div>
                </div>

                {/* Lista de Usuários */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            <p className="text-muted mt-2">Carregando...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-muted">Nenhum paciente encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-primary font-semibold">{user.full_name?.charAt(0)?.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.full_name}</p>
                                                <p className="text-sm text-muted">{user.phone} • CPF: {user.cpf}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                            ? 'bg-success/20 text-green-800'
                                            : 'bg-warning/20 text-yellow-800'
                                            }`}>
                                            {user.is_active ? 'Ativo' : 'Pendente'}
                                        </span>
                                        {user.is_active ? (
                                            <button
                                                onClick={() => handleActivate(user.id, false)}
                                                disabled={activating === user.id}
                                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                {activating === user.id ? '...' : 'Desativar'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(user.id, true)}
                                                disabled={activating === user.id}
                                                className="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                            >
                                                {activating === user.id ? '...' : 'Ativar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
