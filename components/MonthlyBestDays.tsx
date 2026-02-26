'use client'

import { useState } from 'react'

import { Legend } from './Legend'
import type { KoyomiEvent, KoyomiScore, KoyomiVoidTime } from '@/lib/koyomiTypes'
import { LUCKY_DAY_COLORS, SCORE_CATEGORIES } from '@/lib/koyomiTypes'

interface Props {
  year: number
  month: number
  events: KoyomiEvent[]
  scores: KoyomiScore[]
  voidTimes: KoyomiVoidTime[]
}

export function MonthlyBestDays({ year, month, events, scores, voidTimes }: Props) {
  const [sortMode, setSortMode] = useState<'default' | 'high' | 'low'>('default')
  const categories = Object.keys(SCORE_CATEGORIES)
  const bestDaysByCategory: Record<string, { date: string; score: number; reason: string | null; event?: KoyomiEvent; hasVoid: boolean }[]> = {}

  categories.forEach(cat => {
    const catScores = scores
      .filter(s => s.category === cat)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    bestDaysByCategory[cat] = catScores.map(s => {
      const event = events.find(e => e.date === s.date)
      const hasVoid = voidTimes.some(v => v.start_at.substring(0, 10) === s.date || v.end_at.substring(0, 10) === s.date)
      return { date: s.date, score: s.score, reason: s.reason, event, hasVoid }
    })
  })

  const luckyDaysListRaw = events
    .filter(e => e.lucky_days && e.lucky_days.length > 0)
    .map(e => ({
      date: e.date,
      luckyDays: e.lucky_days,
      rokuyo: e.rokuyo,
      unluckyDays: e.unlucky_days,
      score: (scores.find(s => s.date === e.date && s.category === 'overall') || { score: 0 }).score,
      hasVoid: voidTimes.some(v => v.start_at.substring(0, 10) === e.date || v.end_at.substring(0, 10) === e.date),
      voids: voidTimes.filter(v => v.start_at.substring(0, 10) === e.date || v.end_at.substring(0, 10) === e.date),
    }))

  const luckyDaysList = sortMode === 'high'
    ? [...luckyDaysListRaw].sort((a, b) => b.score - a.score)
    : sortMode === 'low'
    ? [...luckyDaysListRaw].sort((a, b) => a.score - b.score)
    : luckyDaysListRaw

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    return (d.getMonth() + 1) + '/' + d.getDate() + '(' + dayNames[d.getDay()] + ')'
  }

  function formatVoidTime(dt: string): string {
    const d = new Date(dt)
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  }

  return (
    <div className="mt-10 space-y-10">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {year + '年' + month + '月の吉日一覧'}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setSortMode('default')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'default' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'日付順'}</button>
            <button onClick={() => setSortMode('high')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'high' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'スコア高い順'}</button>
            <button onClick={() => setSortMode('low')} className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ' + (sortMode === 'low' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{'スコア低い順'}</button>
          </div>
        </div>
        {luckyDaysList.length === 0 ? (
          <p className="text-gray-500">{'この月のデータはまだ登録されていません。'}</p>
        ) : (
          <div className="space-y-3">
            {luckyDaysList.map(item => (
              <div key={item.date} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="font-bold text-gray-900 min-w-[100px]">{formatDate(item.date)}</div>
                    <div className="flex flex-wrap gap-1">
                      {item.luckyDays.map((ld, i) => (
                        <span key={i} className={'text-xs px-2 py-0.5 rounded border ' + (LUCKY_DAY_COLORS[ld] || 'bg-indigo-100 text-indigo-800 border-indigo-300')}>
                          {ld}
                        </span>
                      ))}
                      {item.rokuyo && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{item.rokuyo}</span>
                      )}
                      {item.unluckyDays && item.unluckyDays.map((ud, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 line-through">{ud}</span>
                      ))}
                    </div>
                  </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.hasVoid && item.voids.map((v, vi) => (
                        <span key={'v' + vi} className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 whitespace-nowrap">
                          {'VoC ' + formatVoidTime(v.start_at) + '-' + formatVoidTime(v.end_at)}
                        </span>
                      ))}
                      <span className={'text-lg font-bold min-w-[50px] text-right ' + (item.score >= 80 ? 'text-amber-600' : item.score >= 60 ? 'text-indigo-600' : 'text-gray-400')}>
                        {item.score + '点'}
                      </span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">{'行動別おすすめ日'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(cat => {
            const items = bestDaysByCategory[cat]
            if (!items || items.length === 0) return null
            return (
              <div key={cat} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">{SCORE_CATEGORIES[cat]}</h3>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={item.date} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={'text-sm font-bold flex-shrink-0 ' + (i === 0 ? 'text-amber-600' : i <= 2 ? 'text-indigo-600' : 'text-gray-500')}>
                          {'#' + (i + 1)}
                        </span>
                        <span className="text-sm text-gray-900 flex-shrink-0">{formatDate(item.date)}</span>
                        {item.event && item.event.lucky_days && item.event.lucky_days.length > 0 && (
                          <span className="text-xs text-amber-600 truncate">{item.event.lucky_days.join(' ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.hasVoid && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">VoC</span>}
                        <span className={'text-sm font-bold ' + (item.score >= 80 ? 'text-amber-600' : item.score >= 60 ? 'text-indigo-600' : 'text-gray-500')}>
                          {item.score + '点'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Legend />
    </div>
  )
}
