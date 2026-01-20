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

// Modal de Confirmação Personalizado
const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl transform transition-all scale-100">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
                <p className="text-gray-500 text-center text-sm mb-6">{message}</p>
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-md shadow-red-200 transition-colors"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    )
}

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

    // Estados para Modais de Confirmação
    const [deleteChatId, setDeleteChatId] = useState<string | null>(null)
    const [menuToDelete, setMenuToDelete] = useState<string | null>(null)

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

    // Funcionalidade de Excluir Chat Atualizada
    const confirmDeleteChat = async () => {
        if (!deleteChatId) return

        const supabase = createClient()
        await supabase.from('messages').delete().eq('chat_id', deleteChatId)
        await supabase.from('chats').delete().eq('id', deleteChatId)

        setChats(prev => prev.filter(c => c.id !== deleteChatId))
        if (currentChat?.id === deleteChatId) setCurrentChat(null)
        setDeleteChatId(null)
    }

    // Funcionalidade de Excluir Menu Atualizada
    const confirmDeleteMenu = async () => {
        if (!menuToDelete) return

        const supabase = createClient()
        await supabase.from('menus').delete().eq('id', menuToDelete)

        const remainingMenus = menus.filter(m => m.id !== menuToDelete)
        setMenus(remainingMenus)
        setSelectedMenu(remainingMenus.length > 0 ? remainingMenus[0].id : null)
        setMenuToDelete(null)
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
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col md:flex-row">
            {/* Confirmação de Exclusão de Chat */}
            <ConfirmationModal
                isOpen={!!deleteChatId}
                onClose={() => setDeleteChatId(null)}
                onConfirm={confirmDeleteChat}
                title="Excluir Conversa?"
                message="Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita."
            />

            {/* Confirmação de Exclusão de Menu */}
            <ConfirmationModal
                isOpen={!!menuToDelete}
                onClose={() => setMenuToDelete(null)}
                onConfirm={confirmDeleteMenu}
                title="Excluir Cardápio?"
                message="Tem certeza que deseja remover este cardápio? Ele não estará mais disponível para o chat."
            />

            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
                <button
                    onClick={() => setShowSidebar(true)}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center space-x-2">
                    <Image src="/logo-colorida.png" alt="Logo" width={90} height={35} />
                </div>
                <button
                    onClick={handleNewChat}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50
                w-[85%] max-w-[320px] md:w-80
                bg-white border-r border-gray-200 flex flex-col
                transform transition-transform duration-300 ease-out shadow-2xl md:shadow-none
                ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Visual Header com Logo */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-primary via-primary to-primary-dark relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm mb-3 shadow-inner">
                            <Image src="/logo-branca.png" alt="Logo" width={140} height={60} className="drop-shadow-md" />
                        </div>
                        <p className="text-white/90 text-sm font-medium">
                            Olá, {profile?.full_name?.split(' ')[0]}!
                            {profile?.role === 'admin' && (
                                <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowSidebar(false)}
                        className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Admin Button */}
                {profile?.role === 'admin' && (
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => { setShowAdminPanel(true); setShowSidebar(false) }}
                            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-secondary text-white rounded-xl font-medium hover:bg-secondary-dark transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Painel Nutricionista</span>
                        </button>
                    </div>
                )}

                {/* New Chat Button */}
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors group active:scale-95"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nova Conversa</span>
                    </button>
                </div>

                {/* Menu Selector with Delete */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <span className="w-1 h-4 bg-primary rounded-full"></span>
                            <span className="text-sm font-bold text-gray-800">Seu Cardápio</span>
                        </div>
                        <button
                            onClick={() => { setShowAddMenu(true); setShowSidebar(false) }}
                            className="text-primary text-xs font-bold uppercase tracking-wide hover:underline"
                        >
                            + Adicionar
                        </button>
                    </div>
                    {menus.length > 0 ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={selectedMenu || ''}
                                    onChange={(e) => setSelectedMenu(e.target.value || null)}
                                    className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 shadow-sm appearance-none"
                                >
                                    <option value="">Sem cardápio (dicas gerais)</option>
                                    {menus.map((menu) => (
                                        <option key={menu.id} value={menu.id}>{menu.title}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            {selectedMenu && (
                                <button
                                    onClick={() => setMenuToDelete(selectedMenu)}
                                    className="w-full flex items-center justify-center space-x-2 text-xs text-red-500 bg-red-50 py-2.5 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Excluir este cardápio</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            onClick={() => { setShowAddMenu(true); setShowSidebar(false) }}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">📄</p>
                            <p className="text-xs text-gray-500 font-medium">Você ainda não tem cardápio.</p>
                            <p className="text-[10px] text-primary mt-1 font-bold">Toque para anexar PDF/Word</p>
                        </div>
                    )}
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 py-4">
                    <p className="px-3 mb-2 text-xs text-gray-400 uppercase font-bold tracking-wider">Histórico de Conversas</p>
                    {chats.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-4xl mb-2">💬</p>
                            <p className="text-sm text-gray-400">Nenhuma conversa iniciada.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent ${currentChat?.id === chat.id
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                        : 'hover:bg-gray-100 text-gray-600 hover:border-gray-200'
                                        }`}
                                    onClick={() => handleSelectChat(chat)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{chat.title}</p>
                                        <p className="text-[10px] opacity-70 mt-0.5 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(chat.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteChatId(chat.id) }}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all md:opacity-0 focus:opacity-100 active:opacity-100"
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
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className="w-full text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center space-x-2 py-3 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair da conta</span>
                    </button>
                    <p className="text-[10px] text-center text-gray-300 mt-2">Reeduca-IA v1.0</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 md:h-screen relative overflow-hidden">
                {currentChat ? (
                    <ChatComponent
                        chat={currentChat}
                        menu={menus.find(m => m.id === selectedMenu) || null}
                        onTitleUpdate={(newTitle) => handleChatTitleUpdate(currentChat.id, newTitle)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
                        <div className="text-center max-w-md animate-fade-in-up">
                            <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/10 p-4">
                                <Image src="/logo-colorida.png" alt="Logo" width={150} height={75} className="object-contain" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                                Olá, {profile?.full_name?.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted mb-8 leading-relaxed text-lg">
                                Sou sua assistente nutricional pessoal.<br />
                                <span className="text-sm opacity-70">Selecione uma conversa ou inicie uma nova para começarmos.</span>
                            </p>
                            <button
                                onClick={handleNewChat}
                                className="group btn-primary py-4 px-8 text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all"
                            >
                                <span className="flex items-center space-x-2">
                                    <span>Iniciar Nova Conversa</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
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
