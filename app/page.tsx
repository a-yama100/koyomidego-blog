import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Koyomi de Go! - Lucky Days & Void of Course Moon Calendar',
  description: 'Find the best lucky days based on Japanese traditional calendar. Check Rokuyo, Ichiryu Manbai-bi, Tensha-bi, Tora no Hi, void of course moon times for business, finance, moving, and marriage.',
  openGraph: {
    title: 'Koyomi de Go! - Lucky Days Calendar',
    description: 'Japanese traditional calendar tool for finding auspicious dates.',
    url: 'https://koyomi.phaiworks.com',
    type: 'website',
  },
}

import Link from 'next/link'
import { Container } from '@/components/Container'
import { YearMonthPicker } from '@/components/YearMonthPicker'
import { MiniCalendar } from '@/components/MiniCalendar'

export default function Home() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  return (
    <>
      {/* Hero */}
      <section className="bg-indigo-950 text-white py-8 pb-10">
        <Container>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {'暦でゴー！'}
            </h1>
            <p className="text-base text-indigo-200 mb-6 max-w-2xl mx-auto">
              {'吉日・ボイドタイム・六曜をカレンダーで確認。'}
              <br />
              {'起業・引越・口座開設に最適な日を見つけましょう。'}
            </p>
            {/* Year/Month Picker */}
            <YearMonthPicker />
          </div>
        </Container>
      </section>

      {/* Mini Calendar */}
      <section className="py-10 bg-gray-50">
        <Container>
          <MiniCalendar />
        </Container>
      </section>

      {/* Quick links */}
      <section className="py-6 bg-white border-b border-gray-100">
        <Container>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={'/calendar/' + year + '/' + String(month).padStart(2, '0')}
              className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {'今月の詳細カレンダー'}
            </Link>
            <Link
              href="/best-days"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {'吉日ランキング'}
            </Link>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold text-center mb-12">{'暦でゴー！の特徴'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href={'/calendar/' + year + '/' + String(month).padStart(2, '0')} className="text-center p-6 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:shadow-md transition-all group">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-700">{'吉日カレンダー'}</h3>
              <p className="text-gray-600 text-sm">
                {'一粒万倍日・天赦日・寅の日・巳の日・甲子の日・辰の日など、縁起のいい日を一目で確認できます。'}
              </p>
            </Link>
            <Link href="/about#void" className="text-center p-6 bg-purple-50 rounded-xl hover:bg-purple-100 hover:shadow-md transition-all group">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-purple-700">{'ボイドタイム表示'}</h3>
              <p className="text-gray-600 text-sm">
                {'月のボイドタイム（空白の時間）を表示。新しいことを始めるのに適さない時間帯がわかります。'}
              </p>
            </Link>
            <Link href="/best-days" className="text-center p-6 bg-amber-50 rounded-xl hover:bg-amber-100 hover:shadow-md transition-all group">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-amber-700">{'行動別おすすめ日'}</h3>
              <p className="text-gray-600 text-sm">
                {'起業・引越・口座開設・結婚など、行動別に最適な日をランキングで提案します。'}
              </p>
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
