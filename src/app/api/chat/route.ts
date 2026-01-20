// ============================================================
// API de Chat - Reeduca-IA
// Integração com Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// Prompt do sistema - Regras rígidas para a IA
const SYSTEM_PROMPT_COM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS IMPORTANTES QUE VOCÊ DEVE SEGUIR RIGOROSAMENTE:

1. NUNCA recomende medicamentos, suplementos ou qualquer substância que não seja alimento natural.

2. Baseie suas respostas no cardápio do paciente fornecido abaixo.

3. Se o paciente perguntar sobre algo fora do escopo da nutrição, responda educadamente que você só pode ajudar com questões relacionadas à alimentação.

4. Seja amigável, didática e use linguagem simples e acessível.

5. Quando sugerir substituições de alimentos, certifique-se de que são nutricionalmente equivalentes.

6. Se o paciente perguntar sobre sintomas médicos ou condições de saúde, oriente-o a consultar um médico.

7. Sempre encoraje o paciente a seguir o cardápio prescrito pela nutricionista.

8. Use emojis com moderação para tornar a conversa mais amigável (🥗, 🍎, 💪, etc).

9. Responda sempre em português brasileiro.

10. Se não souber algo ou não tiver certeza, sugira que o paciente entre em contato com a Nutricionista Carla.

CARDÁPIO DO PACIENTE:
`

const SYSTEM_PROMPT_SEM_CARDAPIO = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS IMPORTANTES QUE VOCÊ DEVE SEGUIR RIGOROSAMENTE:

1. NUNCA recomende medicamentos, suplementos ou qualquer substância que não seja alimento natural.

2. O paciente ainda não anexou um cardápio específico, mas você pode ajudar com dúvidas gerais sobre nutrição e alimentação saudável.

3. Se o paciente perguntar sobre algo fora do escopo da nutrição, responda educadamente que você só pode ajudar com questões relacionadas à alimentação.

4. Seja amigável, didática e use linguagem simples e acessível.

5. Dê orientações gerais sobre alimentação saudável, mas lembre que para um plano personalizado o paciente deve consultar a Nutricionista Carla.

6. Se o paciente perguntar sobre sintomas médicos ou condições de saúde, oriente-o a consultar um médico.

7. Use emojis com moderação para tornar a conversa mais amigável (🥗, 🍎, 💪, etc).

8. Responda sempre em português brasileiro.

9. Se não souber algo ou não tiver certeza, sugira que o paciente entre em contato com a Nutricionista Carla.

Lembre-se: você pode dar dicas gerais de nutrição mesmo sem um cardápio específico!
`

export async function POST(request: NextRequest) {
    try {
        const { message, menuContent } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: 'Mensagem é obrigatória' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY

        // Verificar se a chave do Gemini está configurada
        if (!apiKey || apiKey === 'sua_chave_gemini_aqui') {
            return NextResponse.json({
                response: 'Olá! No momento estou em modo de demonstração. Para ativar a IA completa, a chave do Gemini precisa ser configurada. Entre em contato com a Nutricionista Carla para mais informações. 😊'
            })
        }

        // Escolher o prompt baseado se tem cardápio ou não
        let fullPrompt: string
        if (menuContent && menuContent.trim()) {
            fullPrompt = SYSTEM_PROMPT_COM_CARDAPIO + menuContent + '\n\nPergunta do paciente: ' + message
        } else {
            fullPrompt = SYSTEM_PROMPT_SEM_CARDAPIO + '\n\nPergunta do paciente: ' + message
        }

        // Chamar a API do Google Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: fullPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Erro Gemini:', response.status, errorText)
            return NextResponse.json({
                response: `Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. 🙏`
            })
        }

        const data = await response.json()

        // Extrair a resposta do Gemini
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            console.error('Resposta vazia do Gemini:', JSON.stringify(data))
            return NextResponse.json({
                response: 'Desculpe, não consegui processar sua mensagem. Pode reformular sua pergunta? 🤔'
            })
        }

        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro na API de chat:', error)

        return NextResponse.json({
            response: 'Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com a Nutricionista Carla. 🙏'
        })
    }
}
