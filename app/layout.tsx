import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Ajaia Docs',
  description: 'Create, edit, upload, and share rich-text documents.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans bg-[#f4f6fb] text-slate-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
