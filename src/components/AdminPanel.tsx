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
    const [deleting, setDeleting] = useState<string | null>(null)
    const [filter, setFilter] = useState<'pending' | 'active' | 'all'>('pending')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('Usuário não autenticado')
                setLoading(false)
                return
            }

            // Usar API server-side para buscar usuários (sessão lida do cookie pelo servidor)
            const response = await fetch('/api/admin')
            const data = await response.json()

            if (response.ok && data.users) {
                setUsers(data.users)
            } else {
                setError(data.error || 'Erro ao carregar usuários')
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    const handleActivate = async (userId: string, activate: boolean) => {
        setActivating(userId)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return;

            const response = await fetch('/api/admin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    isActive: activate
                })
            })

            if (response.ok) {
                setUsers(prev =>
                    prev.map(u => u.id === userId ? { ...u, is_active: activate } : u)
                )
            }
        } catch (err) {
            console.error('Erro ao atualizar:', err)
        } finally {
            setActivating(null)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!window.confirm('ATENÇÃO: Você está prestes a excluir este paciente PERMANENTEMENTE do sistema.\n\nE-mail, acessos e perfil serão perdidos!\n\nTem certeza que deseja continuar?')) {
            return
        }

        setDeleting(userId)
        
        try {
            const response = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE',
            })
            
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId))
            } else {
                const data = await response.json()
                window.alert(`Erro ao excluir: ${data.error || 'Falha no servidor'}`)
            }
        } catch (err) {
            window.alert('Erro de conexão ao tentar excluir.')
        } finally {
            setDeleting(null)
        }
    }

    const filteredUsers = users.filter(u => {
        if (filter === 'pending') return !u.is_active
        if (filter === 'active') return u.is_active
        return true
    })

    const pendingCount = users.filter(u => !u.is_active).length
    const activeCount = users.filter(u => u.is_active).length

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
            <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-secondary to-secondary-dark">
                    <div>
                        <h2 className="text-lg font-bold text-white">Gerenciar Pacientes</h2>
                        <p className="text-sm text-white/80">Ativar e desativar acessos</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stats */}
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                            <p className="text-xs text-muted">Pendentes</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xl font-bold text-green-600">{activeCount}</p>
                            <p className="text-xs text-muted">Ativos</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xl font-bold text-primary">{users.length}</p>
                            <p className="text-xs text-muted">Total</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 flex gap-2 overflow-x-auto">
                    {[
                        { key: 'pending', label: 'Pendentes', count: pendingCount, color: 'bg-yellow-500' },
                        { key: 'active', label: 'Ativos', count: activeCount, color: 'bg-green-500' },
                        { key: 'all', label: 'Todos', count: users.length, color: 'bg-primary' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as 'pending' | 'active' | 'all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === f.key
                                ? `${f.color} text-white`
                                : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-muted mt-2">Carregando...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-600 mb-2">{error}</p>
                            <p className="text-xs text-muted">Acesso restrito ou configuração incorreta.</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted">Nenhum paciente encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-primary font-semibold">
                                                    {user.full_name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                                                <p className="text-xs text-muted truncate">{user.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleActivate(user.id, !user.is_active)}
                                                disabled={activating === user.id || deleting === user.id}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-shrink-0 transition-colors disabled:opacity-50 ${user.is_active
                                                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                            >
                                                {activating === user.id ? '...' : user.is_active ? 'Desativar' : 'Ativar'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={activating === user.id || deleting === user.id}
                                                className="px-3 py-1.5 rounded-md text-sm font-medium flex-shrink-0 transition-colors disabled:opacity-50 bg-red-50 text-red-600 hover:bg-red-100"
                                            >
                                                {deleting === user.id ? '...' : 'Excluir'}
                                            </button>
                                        </div>
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
