import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://koyomi.phtechai.com'),
  title: {
    default: '暦でゴー！ - 吉日・ボイドタイムカレンダー',
    template: '%s | 暦でゴー！'
  },
  description: '六曜・一粒万倍日・天赦日・寅の日・巳の日・ボイドタイムなど、縁起のいい日をカレンダーで確認。起業・引越・口座開設に最適な日がわかります。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://koyomi.phtechai.com',
    siteName: '暦でゴー！',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W7EM3S0YFS"></script>
        <script dangerouslySetInnerHTML={{__html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W7EM3S0YFS');`}} />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
