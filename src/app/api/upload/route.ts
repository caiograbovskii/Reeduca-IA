// ============================================================
// API de Upload de Cardápio (PDF/Word) - Reeduca-IA
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
// @ts-expect-error - pdf-parse não tem tipos
import pdf from 'pdf-parse/lib/pdf-parse'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string
        const title = formData.get('title') as string

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
                const pdfData = await pdf(buffer)
                extractedText = pdfData.text
            } catch (pdfError) {
                console.error('Erro ao ler PDF:', pdfError)
                return NextResponse.json(
                    { error: 'Erro ao ler o arquivo PDF. Verifique se não está protegido.' },
                    { status: 400 }
                )
            }
        } else if (fileName.endsWith('.docx')) {
            try {
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

    } catch (error) {
        console.error('Erro no upload:', error)
        return NextResponse.json(
            { error: 'Erro ao processar o arquivo.' },
            { status: 500 }
        )
    }
}
