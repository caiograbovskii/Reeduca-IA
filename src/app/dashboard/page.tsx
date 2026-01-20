'use client'

// ============================================================
// Dashboard - Reeduca-IA
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Menu, Chat } from '@/types'
import ChatComponent from '@/components/Chat'
import AdminPanel from '@/components/AdminPanel'
import AddMenuModal from '@/components/AddMenuModal'

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [menus, setMenus] = useState<Menu[]>([])
    const [chats, setChats] = useState<Chat[]>([])
    const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
    const [currentChat, setCurrentChat] = useState<Chat | null>(null)
    const [showAdminPanel, setShowAdminPanel] = useState(false)
    const [showAddMenu, setShowAddMenu] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        // Carregar perfil
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileData) {
            setProfile(profileData)
        }

        // Carregar cardápios
        const { data: menusData } = await supabase
            .from('menus')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (menusData) {
            setMenus(menusData)
            if (menusData.length > 0) {
                setSelectedMenu(menusData[0].id)
            }
        }

        // Carregar chats
        const { data: chatsData } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (chatsData) {
            setChats(chatsData)
        }

        setLoading(false)
    }

    const handleMenuAdded = (newMenu: Menu) => {
        setMenus(prev => [newMenu, ...prev])
        setSelectedMenu(newMenu.id)
        setShowAddMenu(false)
    }

    const handleNewChat = async () => {
        if (!profile || !selectedMenu) return

        const supabase = createClient()

        const { data: newChat, error } = await supabase
            .from('chats')
            .insert({
                user_id: profile.id,
                menu_id: selectedMenu,
                title: 'Nova Conversa',
            })
            .select()
            .single()

        if (newChat) {
            setChats(prev => [newChat, ...prev])
            setCurrentChat(newChat)
        }
    }

    const handleSelectChat = (chat: Chat) => {
        setCurrentChat(chat)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5">
                <div className="text-center">
                    <div className="inline-block animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-muted mt-4 font-medium">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                {/* Header da Sidebar */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-primary to-primary-dark">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Reeduca-IA</h1>
                            <p className="text-xs text-white/80">
                                Olá, {profile?.full_name?.split(' ')[0]}!
                                {profile?.role === 'admin' && (
                                    <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Admin</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botão Painel Admin - Só aparece para admins */}
                {profile?.role === 'admin' && (
                    <div className="p-4 border-b border-gray-100">
                        <button
                            onClick={() => setShowAdminPanel(true)}
                            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl hover:shadow-lg transition-all font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Gerenciar Pacientes</span>
                        </button>
                    </div>
                )}

                {/* Seletor de Cardápio */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Meu Cardápio</label>
                        <button
                            onClick={() => setShowAddMenu(true)}
                            className="text-primary hover:text-primary-dark text-sm font-medium flex items-center space-x-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Adicionar</span>
                        </button>
                    </div>
                    {menus.length > 0 ? (
                        <select
                            value={selectedMenu || ''}
                            onChange={(e) => setSelectedMenu(e.target.value)}
                            className="input py-2.5 text-sm bg-gray-50"
                        >
                            {menus.map((menu) => (
                                <option key={menu.id} value={menu.id}>
                                    {menu.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-muted mb-2">Nenhum cardápio ainda</p>
                            <button
                                onClick={() => setShowAddMenu(true)}
                                className="text-primary font-medium text-sm hover:underline"
                            >
                                + Adicionar Cardápio
                            </button>
                        </div>
                    )}
                </div>

                {/* Botão Nova Conversa */}
                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        disabled={!selectedMenu}
                        className="btn-primary w-full flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Nova Conversa</span>
                    </button>
                </div>

                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto px-3 pb-2">
                    <p className="px-2 py-2 text-xs text-muted uppercase tracking-wider font-semibold">Histórico</p>
                    {chats.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm text-muted">Nenhuma conversa</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => handleSelectChat(chat)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${currentChat?.id === chat.id
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <p className="font-medium text-sm truncate">{chat.title}</p>
                                    <p className="text-xs text-muted mt-0.5">
                                        {new Date(chat.updated_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer da Sidebar */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleLogout}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair da Conta</span>
                    </button>
                </div>
            </aside>

            {/* Área Principal - Chat */}
            <main className="flex-1 flex flex-col">
                {currentChat ? (
                    <ChatComponent
                        chat={currentChat}
                        menu={menus.find(m => m.id === selectedMenu) || null}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
                        <div className="text-center p-8 max-w-lg">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Olá, {profile?.full_name?.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted mb-8 leading-relaxed">
                                Sou sua assistente nutricional inteligente.
                                Posso te ajudar com dúvidas sobre seu cardápio,
                                substituições de alimentos e muito mais!
                            </p>

                            {selectedMenu ? (
                                <button
                                    onClick={handleNewChat}
                                    className="btn-primary inline-flex items-center space-x-2 py-3 px-6 text-lg shadow-lg shadow-primary/30"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>Iniciar Conversa</span>
                                </button>
                            ) : (
                                <div className="bg-secondary/10 rounded-2xl p-6">
                                    <p className="text-secondary-dark font-medium mb-3">
                                        Primeiro, adicione seu cardápio nutricional
                                    </p>
                                    <button
                                        onClick={() => setShowAddMenu(true)}
                                        className="btn-secondary inline-flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Adicionar Cardápio</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modais */}
            {showAdminPanel && (
                <AdminPanel onClose={() => setShowAdminPanel(false)} />
            )}
            {showAddMenu && profile && (
                <AddMenuModal
                    userId={profile.id}
                    onClose={() => setShowAddMenu(false)}
                    onMenuAdded={handleMenuAdded}
                />
            )}
        </div>
    )
}
