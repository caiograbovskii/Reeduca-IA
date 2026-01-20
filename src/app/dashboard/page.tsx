'use client'

// ============================================================
// Dashboard do Paciente - Reeduca-IA
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Menu, Chat } from '@/types'
import ChatComponent from '@/components/Chat'

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [menus, setMenus] = useState<Menu[]>([])
    const [chats, setChats] = useState<Chat[]>([])
    const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
    const [currentChat, setCurrentChat] = useState<Chat | null>(null)

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

    const handleNewChat = async () => {
        if (!profile) return

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-muted mt-3">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header da Sidebar */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Reeduca-IA</h1>
                            <p className="text-xs text-muted">Olá, {profile?.full_name?.split(' ')[0]}!</p>
                        </div>
                    </div>
                </div>

                {/* Seletor de Cardápio */}
                <div className="p-4 border-b border-gray-200">
                    <label className="label">Cardápio Ativo</label>
                    {menus.length > 0 ? (
                        <select
                            value={selectedMenu || ''}
                            onChange={(e) => setSelectedMenu(e.target.value)}
                            className="input py-2 text-sm"
                        >
                            {menus.map((menu) => (
                                <option key={menu.id} value={menu.id}>
                                    {menu.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm text-muted">
                            Nenhum cardápio disponível ainda.
                            Aguarde a nutricionista adicionar.
                        </p>
                    )}
                </div>

                {/* Botão Nova Conversa */}
                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        disabled={!selectedMenu}
                        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nova Conversa</span>
                    </button>
                </div>

                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto p-2">
                    <p className="px-2 py-1 text-xs text-muted uppercase tracking-wide">Histórico</p>
                    {chats.length === 0 ? (
                        <p className="text-sm text-muted text-center py-4">
                            Nenhuma conversa ainda.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => handleSelectChat(chat)}
                                    className={`w-full text-left p-3 rounded-xl transition-colors ${currentChat?.id === chat.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <p className="font-medium text-sm truncate">{chat.title}</p>
                                    <p className="text-xs text-muted">
                                        {new Date(chat.updated_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer da Sidebar */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full text-sm text-muted hover:text-gray-700 flex items-center justify-center space-x-2"
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
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center p-8">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Bem-vindo ao Reeduca-IA!
                            </h2>
                            <p className="text-muted mb-6 max-w-md">
                                Selecione uma conversa anterior ou inicie uma nova para conversar
                                com a IA sobre o seu cardápio nutricional.
                            </p>
                            <button
                                onClick={handleNewChat}
                                disabled={!selectedMenu}
                                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Iniciar Nova Conversa</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
