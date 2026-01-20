// ============================================================
// API de Chat - Reeduca-IA
// Integração com Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

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
        const body = await request.json()
        const { message, menuContent } = body

        if (!message) {
            return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            console.error('GEMINI_API_KEY não encontrada nas variáveis de ambiente')
            return NextResponse.json({
                response: 'Chave da API não configurada. Contate o suporte. 😊'
            })
        }

        // Log para debug
        console.log('API Key encontrada:', apiKey.substring(0, 10) + '...')

        // Montar prompt
        let fullPrompt: string
        if (menuContent && menuContent.trim()) {
            fullPrompt = SYSTEM_PROMPT_COM_CARDAPIO + menuContent + '\n\nPergunta: ' + message
        } else {
            fullPrompt = SYSTEM_PROMPT_SEM_CARDAPIO + '\n\nPergunta: ' + message
        }

        // Usar modelo gemini-1.0-pro (nome correto na v1beta)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`

        console.log('Fazendo requisição para Gemini...')

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            }),
        })

        const responseText = await response.text()

        // Log detalhado
        console.log('Status HTTP:', response.status)
        console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
        console.log('Resposta (primeiros 1000 chars):', responseText.substring(0, 1000))

        if (!response.ok) {
            console.error('Erro HTTP do Gemini:', response.status, responseText)

            // Tentar extrair mensagem de erro
            try {
                const errorData = JSON.parse(responseText)
                const errorMessage = errorData.error?.message || 'Erro desconhecido'
                console.error('Mensagem de erro:', errorMessage)

                // Retornar erro específico para debug
                return NextResponse.json({
                    response: `Erro da API: ${errorMessage.substring(0, 100)}`
                })
            } catch {
                return NextResponse.json({
                    response: `Erro HTTP ${response.status}. Verifique os logs.`
                })
            }
        }

        const data = JSON.parse(responseText)

        if (data.promptFeedback?.blockReason) {
            console.log('Bloqueado por:', data.promptFeedback.blockReason)
            return NextResponse.json({
                response: 'Não posso responder a essa pergunta. Tente reformular. 🤔'
            })
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            console.error('Resposta vazia. Data:', JSON.stringify(data))
            return NextResponse.json({
                response: 'Resposta vazia. Tente novamente. 🤔'
            })
        }

        console.log('Sucesso! Resposta recebida.')
        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro geral na API:', error)
        return NextResponse.json({
            response: `Erro técnico: ${error instanceof Error ? error.message : 'desconhecido'}`
        })
    }
}
