'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarGrid } from './CalendarGrid'
import { MonthlyBestDays } from './MonthlyBestDays'
import type { KoyomiEvent, KoyomiScore, KoyomiVoidTime } from '@/lib/koyomiTypes'

interface Props {
  initialYear: number
  initialMonth: number
}

export function CalendarView({ initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [events, setEvents] = useState<KoyomiEvent[]>([])
  const [scores, setScores] = useState<KoyomiScore[]>([])
  const [voidTimes, setVoidTimes] = useState<KoyomiVoidTime[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/calendar?year=' + year + '&month=' + month)
      const data = await res.json()
      setEvents(data.events || [])
      setScores(data.scores || [])
      setVoidTimes(data.voidTimes || [])
    } catch (err) {
      console.error('Failed to fetch calendar data:', err)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchData()
    window.history.replaceState(null, '', '/calendar/' + year + '/' + String(month).padStart(2, '0'))
  }, [fetchData, year, month])

  const goToPrevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else { setMonth(month - 1) }
  }
  const goToNextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else { setMonth(month + 1) }
  }
  const goToToday = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }

  return (
    <>
      {/* Hero - full width */}
      <section className="bg-indigo-950 text-white py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl md:text-2xl font-bold text-center">
            {year + '年' + month + '月の吉日カレンダー'}
          </h1>
          <p className="text-sm text-indigo-200 text-center mt-1">
            {'六曜・吉日・ボイドタイムを一目で確認'}
          </p>
          <div className="flex items-center gap-3 justify-center mt-4">
            <select
              value={year}
              onChange={e => { setYear(Number(e.target.value)) }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              {Array.from({length: 4}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                <option key={y} value={y}>{y + '\u5e74'}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)) }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{m + '\u6708'}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={goToPrevMonth} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer">
            {'◀ 前月'}
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {year + '年 ' + month + '月'}
            </h2>
            <button onClick={goToToday} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 cursor-pointer">
              {'今月に戻る'}
            </button>
          </div>
          <button onClick={goToNextMonth} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer">
            {'翌月 ▶'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">{'読み込み中...'}</p>
          </div>
        ) : (
          <>
            <CalendarGrid year={year} month={month} events={events} scores={scores} voidTimes={voidTimes} />
            <MonthlyBestDays year={year} month={month} events={events} scores={scores} voidTimes={voidTimes} />
          </>
        )}
      </div>
    </>
  )
}
