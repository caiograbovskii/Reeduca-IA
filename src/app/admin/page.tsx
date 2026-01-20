'use client'

// ============================================================
// Painel Administrativo - Reeduca-IA
// Nutricionista Carla Dantas
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export default function AdminPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<Profile[]>([])
    const [activating, setActivating] = useState<string | null>(null)
    const [filter, setFilter] = useState<'pending' | 'active' | 'all'>('pending')

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('role', 'admin')
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

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const filteredUsers = users.filter(u => {
        if (filter === 'pending') return !u.is_active
        if (filter === 'active') return u.is_active
        return true
    })

    const pendingCount = users.filter(u => !u.is_active).length
    const activeCount = users.filter(u => u.is_active).length

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Reeduca-IA</h1>
                                <p className="text-sm text-muted">Painel Administrativo</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-outline text-sm py-2 px-4">
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                                <p className="text-sm text-muted">Aguardando Aprovação</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                                <p className="text-sm text-muted">Pacientes Ativos</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                                <p className="text-sm text-muted">Total de Pacientes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="card mb-6">
                    <div className="flex flex-wrap gap-2">
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
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {filter === 'pending' ? 'Cadastros Pendentes' :
                            filter === 'active' ? 'Pacientes Ativos' : 'Todos os Pacientes'}
                    </h2>

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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nome</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contato</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                                <p className="text-sm text-muted">{user.address}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-700">{user.phone}</p>
                                                <p className="text-sm text-muted">CPF: {user.cpf}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                                        ? 'bg-success/20 text-green-800'
                                                        : 'bg-warning/20 text-yellow-800'
                                                    }`}>
                                                    {user.is_active ? 'Ativo' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {user.is_active ? (
                                                    <button
                                                        onClick={() => handleActivate(user.id, false)}
                                                        disabled={activating === user.id}
                                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {activating === user.id ? '...' : 'Desativar'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(user.id, true)}
                                                        disabled={activating === user.id}
                                                        className="px-3 py-1.5 text-sm font-medium text-white bg-success rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {activating === user.id ? '...' : 'Ativar'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
