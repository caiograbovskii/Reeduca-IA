// ============================================================
// Tipos TypeScript do Projeto Reeduca-IA
// ============================================================

// Tipos do Banco de Dados
export interface Profile {
    id: string
    full_name: string
    cpf: string
    phone: string
    address: string
    role: 'patient' | 'admin'
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Menu {
    id: string
    user_id: string
    title: string
    content_text: string
    file_url: string | null
    created_at: string
    updated_at: string
}

export interface Chat {
    id: string
    user_id: string
    menu_id: string | null
    title: string
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    chat_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
}

// Tipos de Formulário
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    full_name: string
    cpf: string
    phone: string
    address: string
    email: string
    password: string
    confirm_password: string
}

// Tipos de Estado
export interface AuthState {
    user: Profile | null
    loading: boolean
    error: string | null
}
