'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LUCKY_DAY_COLORS, SCORE_CATEGORIES } from '@/lib/koyomiTypes'
import { Legend } from './Legend'
import type { KoyomiEvent, KoyomiScore, KoyomiVoidTime } from '@/lib/koyomiTypes'

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'overall': '総合的に運気の良い日。何をするにも良い日です。',
  'business': '起業・開業・仕事始め・契約・商談に最適な日。',
  'finance': '口座開設・財布購入・投資開始・宝くじ購入に良い日。',
  'moving': '引越し・新居入り・不動産契約に最適な日。',
  'marriage': '結婚・入籍・結納・告白・プロポーズに最適な日。',
  'travel': '旅行・旅立ち・転居に良い日。',
}

export function BestDaysView() {
  const router = useRouter()
  const [category, setCategory] = useState('overall')
  const [sortMode, setSortMode] = useState<'default' | 'low' | 'date'>('default')
  const [months, setMonths] = useState(3)
  const [data, setData] = useState<{date: string; score: number; reason: string | null; event?: KoyomiEvent; hasVoid: boolean; voidInfo?: string}[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/best-days?category=' + category + '&months=' + months)
      const json = await res.json()
      setData(json.days || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [category, months])

  useEffect(() => { fetchData() }, [fetchData])

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + '(' + dayNames[d.getDay()] + ')'
  }

  const categories = Object.keys(SCORE_CATEGORIES)

  return (
    <div>
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer '
              + (category === cat
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
          >
            {SCORE_CATEGORIES[cat]}
          </button>
        ))}
      </div>

      {/* Month range */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-600">{'表示期間:'}</span>
        {[1, 3, 6, 12].map(m => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={'px-3 py-1 rounded text-sm cursor-pointer '
              + (months === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            {m + 'ヶ月'}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-indigo-800">
          <span className="font-bold">{SCORE_CATEGORIES[category]}</span>
          {': ' + (CATEGORY_DESCRIPTIONS[category] || '')}
        </p>
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setSortMode('date')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'date' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'日付順'}</button>
        <button onClick={() => setSortMode('default')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'default' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'スコア高い順'}</button>
        <button onClick={() => setSortMode('low')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'low' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'スコア低い順'}</button>
      </div>
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-10">{'データがありません。'}</p>
          ) : (
            (() => {
              const sorted = sortMode === 'low' ? [...data].sort((a, b) => a.score - b.score)
                : sortMode === 'date' ? [...data].sort((a, b) => a.date.localeCompare(b.date))
                : data
              return sorted
            })().map((item, i) => (
              <div key={item.date} onClick={() => { const d = new Date(item.date); router.push('/calendar/' + d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0')) }} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 min-w-[60px]">
                  <span className={'text-lg font-bold ' + (i < 3 ? 'text-amber-600' : i < 10 ? 'text-indigo-600' : 'text-gray-400')}>
                    {'#' + (i + 1)}
                  </span>
                  <span className="font-bold text-gray-900">{formatDate(item.date)}</span>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {item.event && item.event.lucky_days && item.event.lucky_days.map((ld, j) => (
                    <span key={j} className={'text-xs px-2 py-0.5 rounded border ' + (LUCKY_DAY_COLORS[ld] || 'bg-indigo-100 text-indigo-800 border-indigo-300')}>
                      {ld}
                    </span>
                  ))}
                  {item.event && item.event.rokuyo && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      {item.event.rokuyo}
                    </span>
                  )}
                  {item.reason && (
                    <span className="text-xs text-gray-500 ml-1">{item.reason}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.hasVoid && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {'VoC' + (item.voidInfo ? ' ' + item.voidInfo : '')}
                    </span>
                  )}
                  <span className={'text-lg font-bold min-w-[50px] text-right '
                    + (item.score >= 80 ? 'text-amber-600' : item.score >= 60 ? 'text-indigo-600' : 'text-gray-400')}>
                    {item.score + '点'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <div className="mt-10">
        <Legend />
      </div>
    </div>
  )
}
