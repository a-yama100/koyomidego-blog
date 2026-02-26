import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'

export const metadata = { title: '利用規約' }

const items = [
  { title: '第1条 適用範囲', content: '本規約は、当サイト（暦でゴー！）の利用に関する条件を定めるものです。' },
  { title: '第2条 サービス内容', content: '当サイトは、日本の暦情報（六曜・吉日・ボイドタイム等）を提供する無料の情報サイトです。' },
  { title: '第3条 免責事項', content: '当サイトの情報は参考情報として提供しており、その正確性・完全性を保証するものではありません。当サイトの情報に基づく行動により生じた損害について、一切の責任を負いません。' },
  { title: '第4条 知的財産権', content: '当サイトのコンテンツ・デザイン・プログラムに関する知的財産権は当サイト運営者に帰属します。' },
  { title: '第5条 規約の変更', content: '本規約は予告なく変更する場合があります。変更後の規約はサイト上に掲載した時点で効力を生じます。' },
]

export default function TermsPage() {
  return (
    <>
      <PageHero title={'利用規約'} />
      <Container size="md" className="py-12">
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h2>
              <p className="text-gray-600 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  )
}
