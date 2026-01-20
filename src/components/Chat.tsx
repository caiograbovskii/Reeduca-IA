'use client'

// ============================================================
// Componente de Chat - Reeduca-IA
// Design Premium
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Chat, Menu, Message } from '@/types'

interface ChatProps {
    chat: Chat
    menu: Menu | null
    onTitleUpdate?: (newTitle: string) => void
}

export default function ChatComponent({ chat, menu, onTitleUpdate }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Carregar mensagens do chat
    useEffect(() => {
        loadMessages()
    }, [chat.id])

    // Scroll para o final quando novas mensagens chegam
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
        }
    }, [input])

    const loadMessages = async () => {
        setLoadingMessages(true)
        const supabase = createClient()

        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)
        }
        setLoadingMessages(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Gerar título inteligente baseado na primeira mensagem
    const generateSmartTitle = (message: string): string => {
        // Limpar e truncar
        let title = message.trim()

        // Remover quebras de linha
        title = title.replace(/\n/g, ' ')

        // Se muito longo, pegar primeiras palavras
        if (title.length > 40) {
            const words = title.split(' ').slice(0, 6)
            title = words.join(' ')
            if (title.length > 40) {
                title = title.substring(0, 40)
            }
            title += '...'
        }

        // Capitalizar primeira letra
        title = title.charAt(0).toUpperCase() + title.slice(1)

        return title
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)

        const supabase = createClient()
        const isFirstMessage = messages.length === 0

        try {
            // Salvar mensagem do usuário no banco
            const { data: savedUserMessage } = await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    role: 'user',
                    content: userMessage,
                })
                .select()
                .single()

            if (savedUserMessage) {
                setMessages(prev => [...prev, savedUserMessage])
            }

            // Se for a primeira mensagem, atualizar título do chat
            if (isFirstMessage) {
                const newTitle = generateSmartTitle(userMessage)
                await supabase
                    .from('chats')
                    .update({ title: newTitle })
                    .eq('id', chat.id)

                // Notificar o parent para atualizar a lista
                if (onTitleUpdate) {
                    onTitleUpdate(newTitle)
                }
            }

            // Chamar API para obter resposta da IA
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    chatId: chat.id,
                    menuContent: menu?.content_text || '',
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            // Salvar resposta da IA no banco
            const { data: savedAssistantMessage } = await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    role: 'assistant',
                    content: data.response,
                })
                .select()
                .single()

            if (savedAssistantMessage) {
                setMessages(prev => [...prev, savedAssistantMessage])
            }

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
            setMessages(prev => [...prev, {
                id: 'error-' + Date.now(),
                chat_id: chat.id,
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
                created_at: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header do Chat */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Nutri-IA</h2>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-sm text-muted">Online</span>
                            </div>
                        </div>
                    </div>
                    {menu && (
                        <div className="hidden md:flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full">
                            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-secondary-dark">{menu.title}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full py-20">
                            <div className="text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-muted mt-3">Carregando conversa...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                                <span className="text-4xl">🥗</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                Olá! Sou a Nutri-IA 👋
                            </h3>
                            <p className="text-muted max-w-md mb-8 leading-relaxed">
                                {menu
                                    ? `Estou pronta para te ajudar com dúvidas sobre seu cardápio "${menu.title}". Pode perguntar!`
                                    : 'Posso te ajudar com dúvidas gerais sobre nutrição e alimentação saudável. Pergunte o que quiser!'
                                }
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                                {[
                                    'Quais alimentos são ricos em proteína?',
                                    'O que comer antes de treinar?',
                                    'Como ter uma alimentação mais saudável?',
                                    'Quantos litros de água devo beber?',
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-5 py-4 ${message.role === 'user'
                                                ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-md shadow-lg'
                                                : 'bg-white shadow-md border border-gray-100 rounded-bl-md'
                                            }`}
                                    >
                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {message.content}
                                        </p>
                                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                                            }`}>
                                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="bg-white shadow-md border border-gray-100 rounded-2xl rounded-bl-md px-5 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <span className="text-sm text-muted ml-2">Pensando...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Área de Input */}
            <div className="border-t border-gray-100 bg-white p-4 shadow-lg">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto">
                    <div className="flex items-end space-x-3 bg-gray-50 rounded-2xl p-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend(e)
                                }
                            }}
                            placeholder="Digite sua pergunta..."
                            className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 text-gray-700 placeholder-gray-400 max-h-[150px]"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex-shrink-0"
                        >
                            {loading ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2">
                        Pressione Enter para enviar • Shift+Enter para nova linha
                    </p>
                </form>
            </div>
        </div>
    )
}
