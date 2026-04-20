'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { KoyomiEvent, KoyomiScore, KoyomiVoidTime } from '@/lib/koyomiTypes'
import { LUCKY_DAY_COLORS } from '@/lib/koyomiTypes'

interface MonthData {
  year: number
  month: number
  events: KoyomiEvent[]
  scores: KoyomiScore[]
  voidTimes: KoyomiVoidTime[]
}

function MiniMonth({ data }: { data: MonthData }) {
  const router = useRouter()
  const { year, month, events, scores, voidTimes } = data
  const handleClick = () => router.push('/calendar/' + year + '/' + String(month).padStart(2, '0'))
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function getOverallScore(dateStr: string): number | null {
    const s = scores.find(sc => sc.date === dateStr && sc.category === 'overall')
    return s ? s.score : null
  }

  function getRank(dateStr: string): number | null {
    const overallScores = scores
      .filter(s => s.category === 'overall')
      .sort((a, b) => b.score - a.score)
    const idx = overallScores.findIndex(s => s.date === dateStr)
    return idx >= 0 ? idx + 1 : null
  }

  function getEvent(dateStr: string): KoyomiEvent | undefined {
    return events.find(e => e.date === dateStr)
  }

  function hasVoid(dateStr: string): boolean {
    return voidTimes.some(v => v.start_at.substring(0, 10) === dateStr || v.end_at.substring(0, 10) === dateStr)
  }

  function scoreBg(score: number | null): string {
    if (!score) return ''
    if (score >= 85) return 'bg-amber-100'
    if (score >= 70) return 'bg-indigo-50'
    return ''
  }

  return (
    <div onClick={handleClick} className="min-w-[320px] sm:min-w-[350px] flex-shrink-0 snap-center cursor-pointer group">
      <Link
        href={'/calendar/' + year + '/' + String(month).padStart(2, '0')}
        className="block text-center font-bold text-lg text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors"
      >
        {year + '年' + month + '月'}
        <span className="text-xs font-normal text-indigo-500 ml-2">{'詳細→'}</span>
      </Link>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
        {dayNames.map((d, i) => (
          <div key={d} className={'text-center text-xs font-bold py-1.5 ' + (i === 0 ? 'bg-red-100 text-red-600' : i === 6 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600')}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="bg-gray-50 h-16" />
          const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
          const colIdx = i % 7
          const score = getOverallScore(dateStr)
          const rank = getRank(dateStr)
          const event = getEvent(dateStr)
          const isToday = dateStr === todayStr
          const voc = hasVoid(dateStr)

          let cellBg = 'bg-white'
          if (colIdx === 0) cellBg = 'bg-red-50/40'
          else if (colIdx === 6) cellBg = 'bg-blue-50/40'
          const sBg = scoreBg(score)
          if (sBg) cellBg = sBg

          return (
            <div key={i} className={'relative h-16 p-0.5 flex flex-col items-center ' + cellBg + (isToday ? ' ring-2 ring-inset ring-indigo-500' : '')}>
              <span className={'text-xs font-bold leading-none mt-0.5 ' + (colIdx === 0 ? 'text-red-500' : colIdx === 6 ? 'text-blue-500' : 'text-gray-700')}>
                {day}
              </span>
              {rank !== null && rank <= 3 && (
                <span className={'text-xs font-black mt-0.5 ' + (rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-gray-400' : 'text-amber-700')}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </span>
              )}
              {rank !== null && rank > 3 && rank <= 5 && (
                <span className="text-[10px] font-bold text-indigo-400 mt-0.5">{'#' + rank}</span>
              )}
              {event && event.lucky_days && event.lucky_days.length > 0 && (
                <div className="flex flex-wrap justify-center gap-px mt-auto mb-0.5">
                  {event.lucky_days.slice(0, 2).map((ld, j) => {
                    const shortName: Record<string, string> = {
                      '一粒万倍日': '万',
                      '天赦日': '天',
                      '寅の日': '寅',
                      '巳の日': '巳',
                      '己巳の日': '己巳',
                      '甲子の日': '甲',
                      '辰の日': '辰',
                    }
                    return (
                      <span key={j} className={'text-[8px] leading-none px-0.5 rounded ' + (LUCKY_DAY_COLORS[ld] || 'bg-indigo-100 text-indigo-700')}>
                        {shortName[ld] || ld.charAt(0)}
                      </span>
                    )
                  })}
                  {event.lucky_days.length > 2 && (
                    <span className="text-[8px] text-gray-400">+{event.lucky_days.length - 2}</span>
                  )}
                </div>
              )}
              {voc && <span className="absolute top-0 right-0.5 text-[7px] text-red-400 font-bold">V</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MiniCalendar() {
  // SSR/hydration時点の値（CDNキャッシュで古くなる可能性あり）
  const today = new Date()
  const [centerYear, setCenterYear] = useState(today.getFullYear())
  const [centerMonth, setCenterMonth] = useState(today.getMonth() + 1)
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // hydration後にクライアントの現在日時で上書き（CDNキャッシュ無効化用）
  useEffect(() => {
    const now = new Date()
    setCenterYear(now.getFullYear())
    setCenterMonth(now.getMonth() + 1)
  }, [])

  // Generate 3 months: prev, current, next
  function getThreeMonths(y: number, m: number) {
    const months: { year: number; month: number }[] = []
    for (let offset = -1; offset <= 1; offset++) {
      let my = y
      let mm = m + offset
      if (mm < 1) { mm = 12; my-- }
      if (mm > 12) { mm = 1; my++ }
      months.push({ year: my, month: mm })
    }
    return months
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const targets = getThreeMonths(centerYear, centerMonth)
      const results = await Promise.all(
        targets.map(async ({ year, month }) => {
          const res = await fetch('/api/calendar?year=' + year + '&month=' + month)
          const data = await res.json()
          return {
            year,
            month,
            events: data.events || [],
            scores: data.scores || [],
            voidTimes: data.voidTimes || [],
          } as MonthData
        })
      )
      setMonthsData(results)
      setLoading(false)
    }
    fetchAll()
  }, [centerYear, centerMonth])

  // Scroll to center month on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const container = scrollRef.current
      const centerEl = container.children[1] as HTMLElement
      if (centerEl) {
        container.scrollLeft = centerEl.offsetLeft - container.offsetLeft - (container.clientWidth - centerEl.clientWidth) / 2
      }
    }
  }, [loading, monthsData])

  const goPrev = () => {
    if (centerMonth === 1) { setCenterYear(centerYear - 1); setCenterMonth(12) }
    else { setCenterMonth(centerMonth - 1) }
  }
  const goNext = () => {
    if (centerMonth === 12) { setCenterYear(centerYear + 1); setCenterMonth(1) }
    else { setCenterMonth(centerMonth + 1) }
  }

  return (
    <div>
      {/* Navigation arrows */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goPrev} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" aria-label="前の月">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm text-gray-500">{'← スクロールで前後の月を表示 →'}</span>
        <button onClick={goNext} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" aria-label="次の月">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">読み込み中...</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin">
          {monthsData.map(d => (
            <MiniMonth key={d.year + '-' + d.month} data={d} />
          ))}
        </div>
      )}

      {/* Mini legend */}
      <div className="flex flex-wrap gap-2 justify-center mt-4 text-[10px] text-gray-500">
        <span>{'🥇🥈🥉 = 総合TOP3'}</span>
        <span>{'V = ボイドタイム'}</span>
        <span className="px-1 rounded bg-amber-100 text-amber-700">万</span>
        <span className="px-1 rounded bg-yellow-100 text-yellow-700">天</span>
        <span className="px-1 rounded bg-orange-100 text-orange-700">寅</span>
        <span className="px-1 rounded bg-emerald-100 text-emerald-700">巳</span>
        <span className="px-1 rounded bg-blue-100 text-blue-700">甲</span>
        <span className="px-1 rounded bg-cyan-100 text-cyan-700">辰</span>
      </div>
    </div>
  )
}
