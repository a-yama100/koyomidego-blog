import Link from 'next/link'
import { Container } from './Container'

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="bg-indigo-950 border-t border-indigo-800 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">*</span>
              <span className="text-lg font-bold text-white">{"暦でゴー！"}</span>
            </div>
            <p className="text-indigo-300 text-sm">
              {"六曜・一粒万倍日・天赦日・ボイドタイムなど、暦の情報をわかりやすくお届けします。"}
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{"ページ"}</h3>
            <ul className="space-y-2">
              <li><Link href="/calendar" className="text-indigo-300 hover:text-white text-sm transition-colors">{"カレンダー"}</Link></li>
              <li><Link href="/best-days" className="text-indigo-300 hover:text-white text-sm transition-colors">{"吉日一覧"}</Link></li>
              <li><Link href="/about" className="text-indigo-300 hover:text-white text-sm transition-colors">{"暦について"}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{"その他"}</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-indigo-300 hover:text-white text-sm transition-colors">{"プライバシーポリシー"}</Link></li>
              <li><Link href="/terms" className="text-indigo-300 hover:text-white text-sm transition-colors">{"利用規約"}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-indigo-800 mt-8 pt-8 text-center">
          <p className="text-indigo-400 text-sm">{"© " + String(currentYear) + " 暦でゴー！ All rights reserved."}</p>
        </div>
      </Container>
    </footer>
  )
}
