'use client'

// ============================================================
// Componente de Chat Mobile-First - Reeduca-IA
// ============================================================

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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

    useEffect(() => {
        loadMessages()
    }, [chat.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
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

        if (data) setMessages(data)
        setLoadingMessages(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const generateSmartTitle = (message: string): string => {
        let title = message.trim().replace(/\n/g, ' ')
        if (title.length > 35) {
            title = title.split(' ').slice(0, 5).join(' ')
            if (title.length > 35) title = title.substring(0, 35)
            title += '...'
        }
        return title.charAt(0).toUpperCase() + title.slice(1)
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
            const { data: savedUserMessage } = await supabase
                .from('messages')
                .insert({ chat_id: chat.id, role: 'user', content: userMessage })
                .select()
                .single()

            if (savedUserMessage) setMessages(prev => [...prev, savedUserMessage])

            if (isFirstMessage) {
                const newTitle = generateSmartTitle(userMessage)
                await supabase.from('chats').update({ title: newTitle }).eq('id', chat.id)
                if (onTitleUpdate) onTitleUpdate(newTitle)
            }

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

            const { data: savedAssistantMessage } = await supabase
                .from('messages')
                .insert({ chat_id: chat.id, role: 'assistant', content: data.response })
                .select()
                .single()

            if (savedAssistantMessage) setMessages(prev => [...prev, savedAssistantMessage])

        } catch (error) {
            console.error('Erro:', error)
            setMessages(prev => [...prev, {
                id: 'error-' + Date.now(),
                chat_id: chat.id,
                role: 'assistant',
                content: 'Erro ao processar. Tente novamente.',
                created_at: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white md:bg-gradient-to-b md:from-gray-50 md:to-white">
            {/* Header - Hidden on mobile (uses dashboard header) */}
            <div className="hidden md:flex bg-white border-b border-gray-100 px-4 py-3 items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Image src="/logo-branca.png" alt="Logo" width={24} height={24} className="brightness-0 invert" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-sm">Nutri-IA</h2>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-muted">Online</span>
                        </div>
                    </div>
                </div>
                {menu && (
                    <div className="flex items-center space-x-2 bg-secondary/10 px-3 py-1.5 rounded-full">
                        <svg className="w-3 h-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-medium text-secondary-dark">{menu.title}</span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <span className="text-3xl">🥗</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Olá! Sou a Nutri-IA 👋</h3>
                            <p className="text-muted text-sm max-w-xs mb-6">
                                {menu
                                    ? `Pronta para te ajudar com seu cardápio "${menu.title}"!`
                                    : 'Posso te ajudar com dúvidas sobre nutrição!'
                                }
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                {[
                                    'Quais alimentos são ricos em proteína?',
                                    'O que comer antes de treinar?',
                                    'Quantos litros de água devo beber?',
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                                            <span className="text-white text-sm">🥗</span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                                ? 'bg-primary text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                        <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'
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
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
                                        <span className="text-white text-sm">🥗</span>
                                    </div>
                                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-3 safe-area-inset-bottom">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                    <div className="flex items-end space-x-2 bg-gray-100 rounded-2xl p-2">
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
                            className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-1.5 text-gray-700 placeholder-gray-400 text-sm max-h-[120px]"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                        >
                            {loading ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
