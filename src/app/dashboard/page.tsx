'use client'

// ============================================================
// Dashboard Mobile-First - Reeduca-IA
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
    const [showSidebar, setShowSidebar] = useState(false)

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

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileData) setProfile(profileData)

        const { data: menusData } = await supabase
            .from('menus')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (menusData) {
            setMenus(menusData)
            if (menusData.length > 0) setSelectedMenu(menusData[0].id)
        }

        const { data: chatsData } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (chatsData) setChats(chatsData)

        setLoading(false)
    }

    const handleMenuAdded = (newMenu: Menu) => {
        setMenus(prev => [newMenu, ...prev])
        setSelectedMenu(newMenu.id)
        setShowAddMenu(false)
    }

    const handleNewChat = async () => {
        if (!profile) return

        const supabase = createClient()
        const { data: newChat } = await supabase
            .from('chats')
            .insert({
                user_id: profile.id,
                menu_id: selectedMenu || null,
                title: 'Nova Conversa',
            })
            .select()
            .single()

        if (newChat) {
            setChats(prev => [newChat, ...prev])
            setCurrentChat(newChat)
            setShowSidebar(false)
        }
    }

    const handleSelectChat = (chat: Chat) => {
        setCurrentChat(chat)
        setShowSidebar(false)
    }

    const handleDeleteChat = async (chatId: string) => {
        if (!confirm('Excluir esta conversa?')) return

        const supabase = createClient()
        await supabase.from('messages').delete().eq('chat_id', chatId)
        await supabase.from('chats').delete().eq('id', chatId)

        setChats(prev => prev.filter(c => c.id !== chatId))
        if (currentChat?.id === chatId) setCurrentChat(null)
    }

    const handleChatTitleUpdate = (chatId: string, newTitle: string) => {
        setChats(prev => prev.map(c =>
            c.id === chatId ? { ...c, title: newTitle } : c
        ))
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
                    <Image src="/logo-colorida.png" alt="Reeduca-IA" width={120} height={60} className="mx-auto mb-4" />
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted mt-4">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
                <button
                    onClick={() => setShowSidebar(true)}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <Image src="/logo-colorida.png" alt="Logo" width={100} height={40} />
                <button
                    onClick={handleNewChat}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50
                w-[85%] max-w-[320px] md:w-80
                bg-white border-r border-gray-200 flex flex-col
                transform transition-transform duration-300 ease-out
                ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary to-primary-dark">
                    <div className="flex items-center justify-between">
                        <Image src="/logo-branca.png" alt="Logo" width={120} height={50} className="brightness-0 invert" />
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="md:hidden w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-white/80 text-sm mt-2">
                        Olá, {profile?.full_name?.split(' ')[0]}!
                        {profile?.role === 'admin' && (
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">Admin</span>
                        )}
                    </p>
                </div>

                {/* Admin Button */}
                {profile?.role === 'admin' && (
                    <div className="p-3 border-b border-gray-100">
                        <button
                            onClick={() => { setShowAdminPanel(true); setShowSidebar(false) }}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-secondary text-white rounded-xl font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Gerenciar Pacientes</span>
                        </button>
                    </div>
                )}

                {/* New Chat Button */}
                <div className="p-3 border-b border-gray-100">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nova Conversa</span>
                    </button>
                </div>

                {/* Menu Selector with Delete */}
                <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Meu Cardápio</span>
                        <button
                            onClick={() => { setShowAddMenu(true); setShowSidebar(false) }}
                            className="text-primary text-sm font-medium"
                        >
                            + Anexar
                        </button>
                    </div>
                    {menus.length > 0 ? (
                        <div className="space-y-2">
                            <select
                                value={selectedMenu || ''}
                                onChange={(e) => setSelectedMenu(e.target.value || null)}
                                className="input py-2 text-sm"
                            >
                                <option value="">Sem cardápio (dicas gerais)</option>
                                {menus.map((menu) => (
                                    <option key={menu.id} value={menu.id}>{menu.title}</option>
                                ))}
                            </select>
                            {selectedMenu && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Excluir este cardápio?')) return
                                        const supabase = createClient()
                                        await supabase.from('menus').delete().eq('id', selectedMenu)
                                        setMenus(prev => prev.filter(m => m.id !== selectedMenu))
                                        setSelectedMenu(menus.length > 1 ? menus.find(m => m.id !== selectedMenu)?.id || null : null)
                                    }}
                                    className="w-full text-xs text-red-600 bg-red-50 py-2 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    🗑️ Excluir cardápio selecionado
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted bg-gray-50 rounded-xl p-3 text-center">
                            💡 Anexe seu cardápio para respostas personalizadas
                        </p>
                    )}
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto p-2">
                    <p className="px-2 py-2 text-xs text-muted uppercase font-semibold">Histórico</p>
                    {chats.length === 0 ? (
                        <p className="text-sm text-muted text-center py-8">Nenhuma conversa</p>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${currentChat?.id === chat.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                    onClick={() => handleSelectChat(chat)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{chat.title}</p>
                                        <p className="text-xs text-muted">
                                            {new Date(chat.updated_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id) }}
                                        className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center ml-2 flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleLogout}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-2 py-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 md:h-screen">
                {currentChat ? (
                    <ChatComponent
                        chat={currentChat}
                        menu={menus.find(m => m.id === selectedMenu) || null}
                        onTitleUpdate={(newTitle) => handleChatTitleUpdate(currentChat.id, newTitle)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <div className="text-center max-w-md">
                            <Image src="/logo-colorida.png" alt="Logo" width={150} height={75} className="mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Olá, {profile?.full_name?.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted mb-8 leading-relaxed">
                                Sou sua assistente nutricional. Posso te ajudar com dúvidas sobre alimentação!
                            </p>
                            <button
                                onClick={handleNewChat}
                                className="btn-primary py-3 px-6 text-lg shadow-lg shadow-primary/30"
                            >
                                Iniciar Conversa
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
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
