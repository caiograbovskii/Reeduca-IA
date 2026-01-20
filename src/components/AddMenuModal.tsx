'use client'

// ============================================================
// Modal para Upload de Cardápio (PDF/Word) - Reeduca-IA
// ============================================================

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Menu } from '@/types'

interface AddMenuModalProps {
    userId: string
    onClose: () => void
    onMenuAdded: (menu: Menu) => void
}

export default function AddMenuModal({ userId, onClose, onMenuAdded }: AddMenuModalProps) {
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (selectedFile: File) => {
        const fileName = selectedFile.name.toLowerCase()
        const validExtensions = ['.pdf', '.docx', '.txt']
        const isValid = validExtensions.some(ext => fileName.endsWith(ext))

        if (!isValid) {
            setError('Formato não suportado. Use PDF, DOCX ou TXT.')
            return
        }

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
            setError('Arquivo muito grande. Máximo 10MB.')
            return
        }

        setFile(selectedFile)
        setError(null)

        // Auto-preencher título com nome do arquivo
        if (!title) {
            const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
            setTitle(nameWithoutExt)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            setError('Selecione um arquivo')
            return
        }

        if (!title.trim()) {
            setError('Digite um nome para o cardápio')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Fazer upload e extrair texto
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', userId)
            formData.append('title', title.trim())

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const uploadData = await uploadResponse.json()

            if (!uploadResponse.ok) {
                setError(uploadData.error || 'Erro ao processar arquivo')
                setLoading(false)
                return
            }

            // Salvar no banco de dados
            const supabase = createClient()

            const { data, error: insertError } = await supabase
                .from('menus')
                .insert({
                    user_id: userId,
                    title: title.trim(),
                    content_text: uploadData.text,
                    file_url: file.name, // Guardar nome do arquivo original
                })
                .select()
                .single()

            if (insertError) {
                setError(insertError.message)
                setLoading(false)
                return
            }

            if (data) {
                onMenuAdded(data)
            }
        } catch (err) {
            setError('Erro ao salvar cardápio')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
            <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-secondary to-secondary-dark">
                    <div>
                        <h2 className="text-lg font-bold text-white">Anexar Cardápio</h2>
                        <p className="text-sm text-white/80 mt-0.5">PDF, Word ou TXT</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nome do Cardápio */}
                    <div className="mb-4">
                        <label className="label">Nome do Cardápio</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input"
                            placeholder="Ex: Cardápio Semana 1"
                            disabled={loading}
                        />
                    </div>

                    {/* Área de Upload */}
                    <div className="mb-6">
                        <label className="label">Arquivo do Cardápio</label>
                        <div
                            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragActive
                                    ? 'border-primary bg-primary/5'
                                    : file
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-primary'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                disabled={loading}
                            />

                            {file ? (
                                <div className="space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{file.name}</p>
                                        <p className="text-sm text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setFile(null); setTitle('') }}
                                        className="text-red-600 text-sm font-medium hover:underline"
                                    >
                                        Remover arquivo
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-700">
                                            Arraste o arquivo aqui
                                        </p>
                                        <p className="text-sm text-muted">ou</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-outline py-2 px-4 text-sm"
                                    >
                                        Selecionar Arquivo
                                    </button>
                                    <p className="text-xs text-muted">
                                        PDF, DOCX ou TXT • Máximo 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col-reverse md:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-outline flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-secondary flex-1"
                            disabled={loading || !file}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processando...
                                </span>
                            ) : (
                                'Salvar Cardápio'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
