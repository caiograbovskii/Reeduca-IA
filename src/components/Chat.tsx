'use client'

// ============================================================
// Componente de Chat - Reeduca-IA
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Chat, Menu, Message } from '@/types'

interface ChatProps {
    chat: Chat
    menu: Menu | null
}

export default function ChatComponent({ chat, menu }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Carregar mensagens do chat
    useEffect(() => {
        loadMessages()
    }, [chat.id])

    // Scroll para o final quando novas mensagens chegam
    useEffect(() => {
        scrollToBottom()
    }, [messages])

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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)

        const supabase = createClient()

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

            // Atualizar título do chat se for a primeira mensagem
            if (messages.length === 0) {
                const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
                await supabase
                    .from('chats')
                    .update({ title })
                    .eq('id', chat.id)
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
            // Adicionar mensagem de erro
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
        <div className="flex flex-col h-screen">
            {/* Header do Chat */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">{chat.title}</h2>
                        {menu && (
                            <p className="text-sm text-muted">
                                Cardápio: {menu.title}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-dark">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Nutri-IA
                        </span>
                    </div>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Olá! Sou sua assistente nutricional. 🥗
                        </h3>
                        <p className="text-muted max-w-md">
                            Posso ajudar com dúvidas sobre seu cardápio, substituições de alimentos,
                            dicas de preparo e muito mais. Como posso ajudar hoje?
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                                        }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-medium text-secondary">Nutri-IA</span>
                                        </div>
                                    )}
                                    <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-gray-700'
                                        }`}>
                                        {message.content}
                                    </p>
                                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-muted'
                                        }`}>
                                        {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Área de Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                    <div className="flex items-end space-x-3">
                        <div className="flex-1">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend(e)
                                    }
                                }}
                                placeholder="Digite sua mensagem..."
                                className="input resize-none"
                                rows={1}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-muted mt-2 text-center">
                        Pressione Enter para enviar • Shift+Enter para nova linha
                    </p>
                </form>
            </div>
        </div>
    )
}
