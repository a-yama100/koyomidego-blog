import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://koyomi.phaiworks.com'),
  title: {
    default: '暦でゴー！ - 吉日・ボイドタイムカレンダー',
    template: '%s | 暦でゴー！'
  },
  description: '六曜・一粒万倍日・天赦日・寅の日・巳の日・ボイドタイムなど、縁起のいい日をカレンダーで確認。起業・引越・口座開設に最適な日がわかります。',
  keywords: ['六曜', '一粒万倍日', '天赦日', '寅の日', '巳の日', 'ボイドタイム', '吉日カレンダー', '縁起のいい日', '開運日', '大安', '友引'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://koyomi.phaiworks.com',
    siteName: '暦でゴー！',
    title: '暦でゴー！ - 吉日・ボイドタイムカレンダー',
    description: '六曜・一粒万倍日・天赦日・寅の日・巳の日・ボイドタイムなど、縁起のいい日をカレンダーで確認。',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: '暦でゴー！ - 吉日・ボイドタイムカレンダー',
    description: '六曜・一粒万倍日・天赦日・寅の日・ボイドタイムなど、縁起のいい日をカレンダーで確認。',
  },
}

const gaId = process.env.NEXT_PUBLIC_GA_ID || ''

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "暦でゴー！",
              "url": "https://koyomi.phaiworks.com",
              "description": "六曜・一粒万倍日・天赦日・寅の日・巳の日・ボイドタイムなど、縁起のいい日をカレンダーで確認できる無料ツールです。",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "PH AI Works",
                "url": "https://www.phaiworks.com"
              }
            })
          }}
        />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        {gaId && (
          <>
            <Script
              src={"https://www.googletagmanager.com/gtag/js?id=" + gaId}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + gaId + "');"}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
