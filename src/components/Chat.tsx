'use client'

// ============================================================
// Componente de Chat Mobile-First - Reeduca-IA
// ============================================================

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Chat, Menu, Message } from '@/types'

// Função simples para renderizar Markdown básico (negrito e listas)
const MarkdownRenderer = ({ content }: { content: string }) => {
    // Processar o conteúdo para tratar negrito e quebras de linha
    const formatText = (text: string) => {
        // Dividir por quebras de linha
        const lines = text.split('\n')

        return lines.map((line, lineIndex) => {
            // Se a linha começar com * ou - é um item de lista
            const isListItem = /^[*-]\s/.test(line)
            const cleanLine = isListItem ? line.replace(/^[*-]\s/, '') : line

            // Processar negrito (**texto**)
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g)

            const formattedLine = parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIndex} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
                }
                return <span key={partIndex}>{part}</span>
            })

            if (isListItem) {
                return (
                    <div key={lineIndex} className="flex items-start mb-1 ml-2">
                        <span className="mr-2 text-primary">•</span>
                        <span>{formattedLine}</span>
                    </div>
                )
            }

            // Linha vazia vira espaçamento
            if (!line.trim()) return <div key={lineIndex} className="h-2" />

            return <div key={lineIndex} className="mb-1">{formattedLine}</div>
        })
    }

    return <div>{formatText(content)}</div>
}

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
        <div className="flex flex-col h-full bg-white">
            {/* Header - Desktop & Mobile Unificado */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                        <Image src="/logo-colorida.png" alt="Símbolo" fill className="object-cover scale-150" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Nutri-IA</h2>
                        <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Online</span>
                        </div>
                    </div>
                </div>

                {menu && (
                    <div className="hidden md:flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                        <span className="text-xs font-semibold text-primary">Cardápio Ativo:</span>
                        <span className="text-xs text-gray-700 max-w-[150px] truncate">{menu.title}</span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                            <div className="w-20 h-20 mb-6 relative grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <Image src="/logo-colorida.png" alt="Logo" fill className="object-contain" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Olá! Sou a Nutri-IA 👋</h3>
                            <p className="text-muted text-sm max-w-xs mb-8">
                                {menu
                                    ? `Analisei seu cardápio "${menu.title}". O que gostaria de saber?`
                                    : 'Estou aqui para tirar suas dúvidas sobre alimentação!'
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                                {[
                                    '🥗 Como posso substituir o frango?',
                                    '🥪 O que comer no lanche da tarde?',
                                    '💧 Qual a quantidade de água ideal?',
                                    '🍎 Sugestão de café da manhã rápido'
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left p-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-200 group"
                                    >
                                        <span className="mr-2 group-hover:scale-110 inline-block transition-transform">{suggestion.split(' ')[0]}</span>
                                        {suggestion.substring(2)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.createdAt ? 'justify-end' : message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm overflow-hidden">
                                            <Image src="/logo-colorida.png" alt="AI" width={30} height={30} className="scale-125" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user'
                                                ? 'bg-primary text-white rounded-br-sm'
                                                : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100'
                                            }`}
                                    >
                                        {message.role === 'user' ? (
                                            message.content
                                        ) : (
                                            <MarkdownRenderer content={message.content} />
                                        )}
                                        <div className={`text-[10px] mt-2 text-right opacity-70 ${message.role === 'user' ? 'text-white' : 'text-gray-400'
                                            }`}>
                                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mr-3 shadow-sm">
                                        <div className="w-5 h-5 bg-primary/20 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                                        <div className="flex items-center space-x-1">
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
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-100 p-4 safe-area-inset-bottom z-10">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner max-h-[120px]"
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 bottom-2.5 p-1.5 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-sm"
                    >
                        {loading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <svg className="w-5 h-5 transform -rotate-45 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
