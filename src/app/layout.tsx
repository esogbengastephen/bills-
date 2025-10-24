import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@mysten/dapp-kit/dist/index.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SuiWalletProvider } from '@/components/SuiWalletProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SwitcherFi - Bill Payment App',
  description: 'Mobile-first bill payment application on Sui blockchain',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366F1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ErrorBoundary>
            <SuiWalletProvider>
              {children}
            </SuiWalletProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
