// ============================================================
// API de Upload de Cardápio (PDF/Word) - Reeduca-IA
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// Configurar como Node.js runtime (não Edge)
export const runtime = 'nodejs'

// Função para extrair texto de PDF usando pdfjs-dist
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Importar pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

    // Converter buffer para Uint8Array
    const uint8Array = new Uint8Array(buffer)

    // Carregar o documento PDF
    const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    let fullText = ''

    // Extrair texto de cada página
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
        fullText += pageText + '\n'
    }

    return fullText
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'Arquivo é obrigatório' },
                { status: 400 }
            )
        }

        const fileName = file.name.toLowerCase()
        let extractedText = ''

        // Converter File para Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Extrair texto baseado no tipo de arquivo
        if (fileName.endsWith('.pdf')) {
            try {
                extractedText = await extractTextFromPDF(buffer)

                // Se não extraiu texto, pode ser um PDF de imagem
                if (!extractedText || extractedText.trim().length < 10) {
                    return NextResponse.json(
                        { error: 'Este PDF parece ser uma imagem escaneada. Por favor, use um PDF com texto selecionável ou um arquivo Word.' },
                        { status: 400 }
                    )
                }

            } catch (pdfError: any) {
                console.error('Erro ao ler PDF:', pdfError?.message || pdfError)

                // Verificar tipos específicos de erro
                if (pdfError?.message?.includes('password') || pdfError?.message?.includes('encrypted')) {
                    return NextResponse.json(
                        { error: 'Este PDF está protegido por senha. Remova a senha e tente novamente.' },
                        { status: 400 }
                    )
                }

                return NextResponse.json(
                    { error: `Erro ao processar PDF: ${pdfError?.message || 'Erro desconhecido'}. Tente salvar como Word (.docx).` },
                    { status: 400 }
                )
            }
        } else if (fileName.endsWith('.docx')) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const mammoth = require('mammoth')
                const result = await mammoth.extractRawText({ buffer })
                extractedText = result.value
            } catch (docError) {
                console.error('Erro ao ler DOCX:', docError)
                return NextResponse.json(
                    { error: 'Erro ao ler o arquivo Word.' },
                    { status: 400 }
                )
            }
        } else if (fileName.endsWith('.doc')) {
            return NextResponse.json(
                { error: 'Formato .doc não suportado. Por favor, salve como .docx' },
                { status: 400 }
            )
        } else if (fileName.endsWith('.txt')) {
            extractedText = buffer.toString('utf-8')
        } else {
            return NextResponse.json(
                { error: 'Formato não suportado. Use PDF, DOCX ou TXT.' },
                { status: 400 }
            )
        }

        // Limpar e validar o texto extraído
        extractedText = extractedText.trim()

        if (!extractedText || extractedText.length < 10) {
            return NextResponse.json(
                { error: 'Não foi possível extrair texto do arquivo. Verifique se o documento não está vazio.' },
                { status: 400 }
            )
        }

        // Limitar tamanho (máximo 50KB de texto)
        if (extractedText.length > 50000) {
            extractedText = extractedText.substring(0, 50000) + '\n\n[Texto truncado por limite de tamanho]'
        }

        return NextResponse.json({
            success: true,
            text: extractedText,
            fileName: file.name,
            size: file.size,
        })

    } catch (error: any) {
        console.error('Erro no upload:', error)
        return NextResponse.json(
            { error: `Erro ao processar o arquivo: ${error?.message || 'Erro desconhecido'}` },
            { status: 500 }
        )
    }
}
