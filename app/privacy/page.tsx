import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'

export const metadata = { title: 'プライバシーポリシー' }

const items = [
  { title: '個人情報の取り扱い', content: '当サイト（暦でゴー！）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。' },
  { title: '収集する情報', content: 'アクセス解析のためにアクセス日時、IPアドレス、ブラウザ情報、参照元URLなどを自動取得する場合があります。これらはサイト改善のみに使用し、第三者への提供は行いません。' },
  { title: '免責事項', content: '当サイトの情報は参考情報であり、その正確性を保証するものではありません。当サイトの利用により生じた損害について、一切の責任を負いません。' },
  { title: 'お問い合わせ', content: 'プライバシーに関するご質問は、サイト運営者までお問い合わせください。' },
]

export default function PrivacyPage() {
  return (
    <>
      <PageHero title={'プライバシーポリシー'} />
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
