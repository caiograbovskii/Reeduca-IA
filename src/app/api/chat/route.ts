// ============================================================
// API de Chat - Reeduca-IA
// Integração com Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// Prompt do sistema - Regras rígidas para a IA
const SYSTEM_PROMPT = `Você é a Nutri-IA, uma assistente virtual especializada em nutrição da Nutricionista Carla Dantas.

REGRAS IMPORTANTES QUE VOCÊ DEVE SEGUIR RIGOROSAMENTE:

1. NUNCA recomende medicamentos, suplementos ou qualquer substância que não seja alimento natural.

2. Sempre baseie suas respostas EXCLUSIVAMENTE no cardápio do paciente fornecido abaixo.

3. Se o paciente perguntar sobre algo fora do escopo do cardápio ou da nutrição, responda educadamente que você só pode ajudar com questões relacionadas ao cardápio e alimentação.

4. Seja amigável, didática e use linguagem simples e acessível.

5. Quando sugerir substituições de alimentos, certifique-se de que são nutricionalmente equivalentes e estejam no perfil do cardápio.

6. Se o paciente perguntar sobre sintomas médicos ou condições de saúde, oriente-o a consultar um médico.

7. Sempre encoraje o paciente a seguir o cardápio prescrito pela nutricionista.

8. Use emojis com moderação para tornar a conversa mais amigável (🥗, 🍎, 💪, etc).

9. Responda sempre em português brasileiro.

10. Se não souber algo ou não tiver certeza, diga honestamente que não sabe e sugira que o paciente entre em contato com a Nutricionista Carla.

CARDÁPIO DO PACIENTE:
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
            return NextResponse.json(
                {
                    response: 'Olá! No momento estou em modo de demonstração. Para ativar a IA completa, a chave do Gemini precisa ser configurada. Entre em contato com a Nutricionista Carla para mais informações. 😊'
                },
                { status: 200 }
            )
        }

        // Montar o prompt completo
        const systemMessage = SYSTEM_PROMPT + (menuContent || 'Nenhum cardápio específico foi fornecido para este paciente ainda.')

        // Chamar a API do Google Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: `${systemMessage}\n\nPergunta do paciente: ${message}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        }
                    ]
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Erro Gemini:', errorData)
            throw new Error('Erro ao comunicar com a IA')
        }

        const data = await response.json()

        // Extrair a resposta do Gemini
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Desculpe, não consegui processar sua mensagem. Tente novamente.'

        return NextResponse.json({ response: aiResponse })

    } catch (error) {
        console.error('Erro na API de chat:', error)

        return NextResponse.json({
            response: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou entre em contato com a Nutricionista Carla.'
        })
    }
}
