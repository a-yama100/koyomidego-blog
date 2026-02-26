import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import Link from 'next/link'

export const metadata = {
  title: '暦について',
  description: '六曜・吉日・ボイドタイムなど、暦の基本情報を解説します。',
}

const sections = [
  {
    id: 'rokuyo',
    title: '六曜とは',
    color: 'border-indigo-400 bg-indigo-50',
    titleColor: 'text-indigo-800',
    content: '六曜（ろくよう）は、日本の暦における毎日の吉凶を示す指標です。「大安」「友引」「先勝」「先負」「仏滅」「赤口」の6種類があり、旧暦の日付を基に決まります。結婚式やお祝い事には「大安」が好まれます。',
  },
  {
    id: 'ichiryuu',
    title: '一粒万倍日',
    color: 'border-amber-400 bg-amber-50',
    titleColor: 'text-amber-800',
    content: '一粒の籾（もみ）が万倍に実るという意味の吉日です。新しいことを始めるのに最適で、開業・開店・購入などに良い日とされています。ただし、借金や悪口は苦労まで万倍になるので注意が必要です。',
  },
  {
    id: 'tensha',
    title: '天赦日',
    color: 'border-yellow-400 bg-yellow-50',
    titleColor: 'text-yellow-800',
    content: '天が万物の罪を赦（ゆる）す日とされる、暦上最強の吉日です。年に5～6回しかない貴重な日で、この日に始めたことは成功するといわれています。開業・結婚・引越など大きなイベントに最適です。',
  },
  {
    id: 'tora',
    title: '寅の日',
    color: 'border-orange-400 bg-orange-50',
    titleColor: 'text-orange-800',
    content: '虎は長距離を移動して必ず戻ってくるといわれ、旅立ちや金運に良い日です。お金を使っても戻ってくるとされています。毘沙門天が祈られている神仏に行くのもおすすめです。',
  },
  {
    id: 'mi',
    title: '巳の日・己巳の日',
    color: 'border-emerald-400 bg-emerald-50',
    titleColor: 'text-emerald-800',
    content: '弁財天と縁のある日で、金運や財運にまつわる縁起のいい日です。白蛇にお願いごとをすると弁財天に届けてくれるとされます。60日に1回の「己巳の日」はさらに強力で、金運が最強です。',
  },
  {
    id: 'kinoe',
    title: '甲子の日',
    color: 'border-blue-400 bg-blue-50',
    titleColor: 'text-blue-800',
    content: '大黒天と縁のある日で、財運・金運・商売繁盛の吉日です。この日に始めたことは長続きするといわれ、縁結びにも良い日です。大黒天を祈る神社に参拝するのもおすすめです。',
  },
  {
    id: 'tatsu',
    title: '辰の日',
    color: 'border-cyan-400 bg-cyan-50',
    titleColor: 'text-cyan-800',
    content: '龍神さまと縁のある日で、金運上昇・商売繁盛・仕事運アップの日とされています。龍神さまを祈る神社に参拝してお願いごとをすれば、夢が叶う可能性大です。',
  },
  {
    id: 'void',
    title: 'ボイドタイムとは',
    color: 'border-red-400 bg-red-50',
    titleColor: 'text-red-800',
    content: 'ボイドタイム（Void of Course Moon）とは、月が現在の星座で最後のメジャーアスペクトを形成してから、次の星座に移るまでの時間帯です。この時間帯は、新しいことを始めるのに適さないとされています。当サイトでは天文計算ライブラリ（Skyfield）を使用して算出しています。',
  },
  {
    id: 'fuseijoubi',
    title: '不成就日とは',
    color: 'border-gray-400 bg-gray-50',
    titleColor: 'text-gray-800',
    content: '何事も成就しない日とされる凶日です。吉日と重なると、吉日の効果が半減するといわれています。当サイトでは不成就日と重なる吉日のスコアを自動で減点しています。',
  },
  {
    id: 'score',
    title: 'スコアについて',
    color: 'border-indigo-400 bg-indigo-50',
    titleColor: 'text-indigo-800',
    content: '当サイトのスコアは、吉日の種類・六曜・不成就日・月相などを総合的に考慮した独自の指標です。行動別（起業・金運・引越・結婚・旅行）にそれぞれ異なる重み付けで計算されています。あくまで参考情報としてお楽しみください。',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHero title={'暦について'} subtitle={'吉日・六曜・ボイドタイムの基本を解説'} />
      <Container size="md" className="py-12">
        <div className="space-y-6">
          {sections.map(s => (
            <div key={s.id} id={s.id} className={'p-6 rounded-xl border-l-4 shadow-sm scroll-mt-24 ' + s.color}>
              <h2 className={'text-xl font-bold mb-3 ' + s.titleColor}>{s.title}</h2>
              <p className="text-gray-700 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  )
}
