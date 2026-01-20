// ============================================================
// API de Chat - Reeduca-IA
// Integração com Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// Prompt do sistema - Regras rígidas para a IA
const SYSTEM_PROMPT_COM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS IMPORTANTES:

1. NUNCA recomende medicamentos, suplementos ou qualquer substância que não seja alimento natural.

2. Baseie suas respostas no cardápio do paciente fornecido abaixo.

3. Seja amigável, didática e use linguagem simples.

4. Use emojis com moderação (🥗, 🍎, 💪, etc).

5. Responda sempre em português brasileiro.

6. Se o paciente perguntar sobre sintomas médicos, oriente-o a consultar um médico.

CARDÁPIO DO PACIENTE:
`

const SYSTEM_PROMPT_SEM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS IMPORTANTES:

1. NUNCA recomende medicamentos, suplementos ou qualquer substância que não seja alimento natural.

2. O paciente ainda não anexou um cardápio, mas você pode ajudar com dúvidas gerais sobre nutrição.

3. Seja amigável, didática e use linguagem simples.

4. Use emojis com moderação (🥗, 🍎, 💪, etc).

5. Responda sempre em português brasileiro.

6. Se o paciente perguntar sobre sintomas médicos, oriente-o a consultar um médico.

Você pode dar dicas gerais de nutrição mesmo sem um cardápio específico!
`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, menuContent } = body

        if (!message) {
            return NextResponse.json(
                { error: 'Mensagem é obrigatória' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY

        // Verificar se a chave do Gemini está configurada
        if (!apiKey) {
            console.error('GEMINI_API_KEY não configurada')
            return NextResponse.json({
                response: 'Olá! Para ativar a IA, a chave do Gemini precisa ser configurada. Entre em contato com a Nutricionista Carla. 😊'
            })
        }

        // Escolher o prompt baseado se tem cardápio ou não
        let fullPrompt: string
        if (menuContent && menuContent.trim()) {
            fullPrompt = SYSTEM_PROMPT_COM_CARDAPIO + menuContent + '\n\nPergunta do paciente: ' + message
        } else {
            fullPrompt = SYSTEM_PROMPT_SEM_CARDAPIO + '\n\nPergunta do paciente: ' + message
        }

        // Usar o modelo gemini-1.5-flash-latest
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            }),
        })

        const responseText = await response.text()

        if (!response.ok) {
            console.error('Erro Gemini HTTP:', response.status, responseText)
            return NextResponse.json({
                response: `Estou com dificuldades no momento. Tente novamente em instantes. 🙏`
            })
        }

        let data
        try {
            data = JSON.parse(responseText)
        } catch {
            console.error('Erro ao parsear resposta:', responseText)
            return NextResponse.json({
                response: 'Erro ao processar resposta. Tente novamente. 🙏'
            })
        }

        // Verificar se há bloqueio de segurança
        if (data.promptFeedback?.blockReason) {
            return NextResponse.json({
                response: 'Desculpe, não posso responder a essa pergunta. Tente reformular de outra forma. 🤔'
            })
        }

        // Extrair a resposta do Gemini
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            console.error('Resposta vazia do Gemini:', JSON.stringify(data))
            return NextResponse.json({
                response: 'Não consegui processar sua mensagem. Pode reformular? 🤔'
            })
        }

        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro na API de chat:', error)
        return NextResponse.json({
            response: 'Erro inesperado. Tente novamente ou contate a Nutricionista Carla. 🙏'
        })
    }
}
