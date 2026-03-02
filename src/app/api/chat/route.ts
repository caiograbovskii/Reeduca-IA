// ============================================================
// API de Chat - Reeduca-IA
// Integração com Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Prompt do sistema
const SYSTEM_PROMPT_COM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS:
1. NUNCA recomende medicamentos ou suplementos.
2. Baseie suas respostas no cardápio fornecido.
3. Seja amigável e use linguagem simples.
4. Use emojis com moderação (🥗, 🍎, 💪).
5. Responda em português brasileiro.
6. Para sintomas médicos, oriente consultar um médico.

CARDÁPIO DO PACIENTE:
`

const SYSTEM_PROMPT_SEM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS:
1. NUNCA recomende medicamentos ou suplementos.
2. O paciente não anexou cardápio, dê dicas gerais.
3. Seja amigável e use linguagem simples.
4. Use emojis com moderação (🥗, 🍎, 💪).
5. Responda em português brasileiro.
6. Para sintomas médicos, oriente consultar um médico.
`

export async function POST(request: NextRequest) {
    try {
        // --- PROTEÇÃO DE SESSÃO DA API ---
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Tentativa de acesso não autorizado à API de Chat')
            return NextResponse.json({ error: 'Acesso negado. Faça login para utilizar o chat.' }, { status: 401 })
        }
        // ---------------------------------

        const body = await request.json()
        const { message, menuContent } = body

        // Log para debug
        console.log('Recebida requisição:', { message, hasMenu: !!menuContent, userId: user.id })

        if (!message) {
            return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            console.error('GEMINI_API_KEY não encontrada')
            return NextResponse.json({ response: 'Chave API não configurada.' })
        }

        // 1. Listar modelos disponíveis para esta chave
        console.log('Buscando modelos disponíveis...')
        const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

        let modelName = 'gemini-1.5-flash' // Fallback padrão

        try {
            const modelsResponse = await fetch(modelsUrl)
            const modelsData = await modelsResponse.json()

            if (modelsResponse.ok && modelsData.models) {
                console.log('Modelos encontrados:', modelsData.models.map((m: any) => m.name))

                // Tentar encontrar um gemini que suporte generateContent
                // Prioridade: gemini-1.5-flash -> gemini-pro -> qualquer gemini

                const availableModels = modelsData.models.filter((m: any) =>
                    m.name.includes('gemini') &&
                    m.supportedGenerationMethods.includes('generateContent')
                )

                if (availableModels.length > 0) {
                    // Tentar flash primeiro (mais rápido/barato)
                    const flash = availableModels.find((m: any) => m.name.includes('flash'))
                    const pro = availableModels.find((m: any) => m.name.includes('pro'))

                    if (flash) {
                        modelName = flash.name.replace('models/', '')
                    } else if (pro) {
                        modelName = pro.name.replace('models/', '')
                    } else {
                        modelName = availableModels[0].name.replace('models/', '')
                    }
                }
            } else {
                console.warn('Não foi possível listar modelos, usando fallback:', modelName)
            }
        } catch (e) {
            console.error('Erro ao buscar lista de modelos:', e)
        }

        console.log('Modelo selecionado:', modelName)

        // 2. Montar prompt
        let fullPrompt: string
        if (menuContent && menuContent.trim()) {
            fullPrompt = SYSTEM_PROMPT_COM_CARDAPIO + menuContent + '\n\nPergunta: ' + message
        } else {
            fullPrompt = SYSTEM_PROMPT_SEM_CARDAPIO + '\n\nPergunta: ' + message
        }

        // 3. Usar o modelo selecionado
        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        const response = await fetch(generateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            }),
        })

        const responseText = await response.text()

        if (!response.ok) {
            let errorMessage = 'Erro desconhecido na API'
            try {
                const errorData = JSON.parse(responseText)
                console.error('Erro Gemini Detalhado:', JSON.stringify(errorData, null, 2))
                errorMessage = errorData.error?.message || errorMessage
            } catch {
                console.error('Erro Gemini Raw:', responseText)
            }

            return NextResponse.json({
                response: `Erro da API (${modelName}): ${errorMessage}`
            })
        }

        const data = JSON.parse(responseText)
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            console.error('Resposta vazia da IA:', JSON.stringify(data))
            return NextResponse.json({ response: 'Sem resposta da IA. Tente novamente.' })
        }

        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro geral no handler:', error)
        return NextResponse.json({
            response: `Erro técnico: ${error instanceof Error ? error.message : 'desconhecido'}`
        })
    }
}
