import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Абхазия.ру — доска объявлений',
  description: 'Бесплатные объявления Абхазии: недвижимость, авто, работа и многое другое',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f4f7f5] dark:bg-[#0f1a14] text-gray-900 dark:text-[#e8f5ee] transition-colors">
        <ThemeProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
