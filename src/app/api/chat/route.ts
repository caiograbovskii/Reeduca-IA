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
            return NextResponse.json({
                response: 'A IA precisa ser configurada. Contate a Nutricionista Carla. 😊'
            })
        }

        // Montar prompt
        let fullPrompt: string
        if (menuContent && menuContent.trim()) {
            fullPrompt = SYSTEM_PROMPT_COM_CARDAPIO + menuContent + '\n\nPergunta: ' + message
        } else {
            fullPrompt = SYSTEM_PROMPT_SEM_CARDAPIO + '\n\nPergunta: ' + message
        }

        // Testar com modelo gemini-pro (mais estável)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

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
        console.log('Gemini Response Status:', response.status)
        console.log('Gemini Response:', responseText.substring(0, 500))

        if (!response.ok) {
            // Tentar extrair mensagem de erro
            try {
                const errorData = JSON.parse(responseText)
                console.error('Gemini Error:', errorData.error?.message || responseText)
            } catch {
                console.error('Gemini Error Raw:', responseText)
            }
            return NextResponse.json({
                response: `Desculpe, não consegui processar. Tente novamente. 🙏`
            })
        }

        const data = JSON.parse(responseText)

        if (data.promptFeedback?.blockReason) {
            return NextResponse.json({
                response: 'Não posso responder a essa pergunta. Tente reformular. 🤔'
            })
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            console.error('Resposta vazia:', JSON.stringify(data))
            return NextResponse.json({
                response: 'Não entendi. Pode reformular sua pergunta? 🤔'
            })
        }

        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro na API:', error)
        return NextResponse.json({
            response: 'Erro técnico. Tente novamente. 🙏'
        })
    }
}
