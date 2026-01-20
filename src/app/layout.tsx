// ============================================================
// Layout Principal - Reeduca-IA
// ============================================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reeduca-IA | Nutricionista Carla Dantas',
  description: 'Assistente nutricional inteligente para acompanhamento do seu cardápio.',
  keywords: ['nutrição', 'nutricionista', 'cardápio', 'saúde', 'alimentação', 'IA'],
  authors: [{ name: 'Carla Dantas' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
