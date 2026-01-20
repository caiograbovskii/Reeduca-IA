// ============================================================
// API de Chat - Reeduca-IA
// Integração com OpenAI
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Inicializar cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

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

        // Verificar se a chave da OpenAI está configurada
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sua_chave_openai_aqui') {
            return NextResponse.json(
                {
                    response: 'Olá! No momento estou em modo de demonstração. Para ativar a IA completa, a chave da OpenAI precisa ser configurada. Entre em contato com a Nutricionista Carla para mais informações. 😊'
                },
                { status: 200 }
            )
        }

        // Montar o prompt completo
        const systemMessage = SYSTEM_PROMPT + (menuContent || 'Nenhum cardápio específico foi fornecido para este paciente ainda.')

        // Chamar a API da OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Modelo mais econômico e rápido
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7, // Balanceado entre criatividade e precisão
        })

        const response = completion.choices[0]?.message?.content ||
            'Desculpe, não consegui processar sua mensagem. Tente novamente.'

        return NextResponse.json({ response })

    } catch (error) {
        console.error('Erro na API de chat:', error)

        // Verificar se é erro de quota ou chave inválida
        if (error instanceof Error) {
            if (error.message.includes('quota') || error.message.includes('billing')) {
                return NextResponse.json({
                    response: 'O serviço de IA está temporariamente indisponível. Por favor, tente novamente mais tarde ou entre em contato com a Nutricionista Carla.'
                })
            }
            if (error.message.includes('API key')) {
                return NextResponse.json({
                    response: 'Configuração de API pendente. Entre em contato com a Nutricionista Carla.'
                })
            }
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
