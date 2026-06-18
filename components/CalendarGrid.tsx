'use client'
import { useMemo } from 'react'
import type { KoyomiEvent, KoyomiScore, KoyomiVoidTime, CalendarDay } from '@/lib/koyomiTypes'
import { LUCKY_DAY_COLORS, ROKUYO_COLORS, UNLUCKY_COLORS } from '@/lib/koyomiTypes'

interface Props {
  year: number
  month: number
  events: KoyomiEvent[]
  scores: KoyomiScore[]
  voidTimes: KoyomiVoidTime[]
}

function formatVoidTime(dt: string): string {
  const d = new Date(dt)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-amber-50'
  if (score >= 70) return 'bg-indigo-50'
  return ''
}

export function CalendarGrid({ year, month, events, scores, voidTimes }: Props) {
  const days = useMemo(() => {
    const result: CalendarDay[] = []
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay()
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month - 1, -startDow + i + 1)
      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      result.push({ date: dateStr, dayOfMonth: d.getDate(), isCurrentMonth: false, scores: [], voidTimes: [] })
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
      const event = events.find(e => e.date === dateStr)
      const dayScores = scores.filter(s => s.date === dateStr)
      const dayVoids = voidTimes.filter(v => {
        const start = v.start_at.substring(0, 10)
        const end = v.end_at.substring(0, 10)
        return start === dateStr || end === dateStr
      })
      result.push({ date: dateStr, dayOfMonth: day, isCurrentMonth: true, event, scores: dayScores, voidTimes: dayVoids })
    }
    const remaining = 7 - (result.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month, i)
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
        result.push({ date: dateStr, dayOfMonth: d.getDate(), isCurrentMonth: false, scores: [], voidTimes: [] })
      }
    }
    return result
  }, [year, month, events, scores, voidTimes])

  const today = new Date()
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const dayHeaders = ['\u65e5', '\u6708', '\u706b', '\u6c34', '\u6728', '\u91d1', '\u571f']
  const dayHeaderColors = ['text-red-600 bg-red-50', 'text-gray-700 bg-gray-50', 'text-gray-700 bg-gray-50', 'text-gray-700 bg-gray-50', 'text-gray-700 bg-gray-50', 'text-gray-700 bg-gray-50', 'text-blue-600 bg-blue-50']

  return (
    <>
    {/* Desktop: 7-column month grid */}
    <div className="hidden md:block border-2 border-indigo-200 rounded-xl overflow-hidden shadow-lg">
      <div className="grid grid-cols-7">
        {dayHeaders.map((d, i) => (
          <div key={i} className={'text-center py-3 text-base font-bold border-b-2 border-indigo-200 ' + dayHeaderColors[i]}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isToday = day.date === todayStr
          const isSunday = i % 7 === 0
          const isSaturday = i % 7 === 6
          const overallScore = day.scores.find(s => s.category === 'overall')
          const hasLucky = day.event && day.event.lucky_days && day.event.lucky_days.length > 0
          const scoreBg = overallScore ? getScoreBg(overallScore.score) : ''

          return (
            <div
              key={day.date}
              className={
                'border-t border-r border-gray-200 p-1.5 min-h-[100px] md:min-h-[140px] flex flex-col transition-colors '
                + (day.isCurrentMonth
                  ? (hasLucky ? 'bg-gradient-to-br from-white to-amber-50/30 ' : scoreBg ? scoreBg + ' ' : 'bg-white ')
                  : 'bg-gray-100 opacity-40 ')
                + (isToday ? 'ring-3 ring-inset ring-indigo-500 ' : '')
                + (isSunday && day.isCurrentMonth ? 'bg-red-50/30 ' : '')
                + (isSaturday && day.isCurrentMonth ? 'bg-blue-50/30 ' : '')
              }
            >
              {/* Top content */}
              <div className="flex-1">
                <div className={'text-base md:text-lg font-bold mb-1 '
                  + (isToday ? 'bg-indigo-600 text-white rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-base '
                    : isSunday ? 'text-red-600 ' : isSaturday ? 'text-blue-600 ' : 'text-gray-900 ')}>
                  {day.dayOfMonth}
                </div>
                {day.isCurrentMonth && day.event && (
                  <div className="space-y-0.5">
                    {day.event.rokuyo && (
                      <div className={'text-sm md:text-base font-medium ' + (ROKUYO_COLORS[day.event.rokuyo] || 'text-gray-500')}>{day.event.rokuyo}</div>
                    )}
                    {day.event.lucky_days && day.event.lucky_days.map((ld, j) => (
                      <div key={j} className={'text-xs md:text-sm px-1.5 py-0.5 rounded-md border-2 inline-block mr-0.5 mb-0.5 font-bold '
                        + (LUCKY_DAY_COLORS[ld] || 'bg-indigo-100 text-indigo-800 border-indigo-300')}>{ld}</div>
                    ))}
                    {day.event.unlucky_days && day.event.unlucky_days.map((ud, j) => (
                      <div key={j} className={'text-xs md:text-sm px-1.5 py-0.5 rounded-md border inline-block mr-0.5 mb-0.5 font-medium '
                        + (UNLUCKY_COLORS[ud] || 'bg-gray-100 text-gray-500 border-gray-300')}>{ud}</div>
                    ))}
                    {day.event.eto && (
                      <div className="text-xs md:text-sm text-gray-400 hidden md:block">{day.event.eto}</div>
                    )}
                    {day.event.lunar_phase && (
                      <div className="text-xs md:text-sm text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded-md inline-block">{day.event.lunar_phase}</div>
                    )}
                    {day.event.solar_term && (
                      <div className="text-xs md:text-sm text-green-800 font-bold bg-green-100 px-1.5 py-0.5 rounded-md inline-block">{day.event.solar_term}</div>
                    )}
                    {day.event.notes && (
                      <div className="text-xs md:text-sm text-pink-700 font-bold">{day.event.notes}</div>
                    )}
                  </div>
                )}
                {day.voidTimes.length > 0 && day.isCurrentMonth && (
                  <div className="mt-0.5">
                    {day.voidTimes.map((v, j) => (
                      <div key={j} className="text-xs md:text-sm bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md border border-red-300 font-medium">
                        {'VoC ' + formatVoidTime(v.start_at) + '-' + formatVoidTime(v.end_at)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Score pinned to bottom */}
              {overallScore && day.isCurrentMonth && (
                <div className={'text-xs md:text-sm font-bold text-right mt-auto pt-0.5 '
                  + (overallScore.score >= 80 ? 'text-amber-600' : overallScore.score >= 60 ? 'text-indigo-600' : 'text-gray-400')}>
                  {overallScore.score + '点'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>

    {/* Mobile: per-day agenda list */}
    <div className="md:hidden space-y-2">
      {days.filter(d => d.isCurrentMonth).map((day) => {
        const dow = new Date(day.date).getDay()
        const isToday = day.date === todayStr
        const overallScore = day.scores.find(s => s.category === 'overall')
        const ev = day.event
        const hasLucky = !!(ev && ev.lucky_days && ev.lucky_days.length)
        return (
          <div
            key={day.date}
            className={
              'flex gap-3 rounded-xl border p-3 '
              + (isToday ? 'border-indigo-500 ring-2 ring-indigo-200 ' : 'border-gray-200 ')
              + (hasLucky ? 'bg-amber-50/40 ' : 'bg-white ')
            }
          >
            <div className="flex w-11 shrink-0 flex-col items-center">
              <div className={'text-2xl font-bold leading-none ' + (dow === 0 ? 'text-red-600' : dow === 6 ? 'text-blue-600' : 'text-gray-900')}>{day.dayOfMonth}</div>
              <div className={'mt-0.5 text-xs ' + (dow === 0 ? 'text-red-600' : dow === 6 ? 'text-blue-600' : 'text-gray-500')}>{dayHeaders[dow]}</div>
              {overallScore && (
                <div className={'mt-1 text-xs font-bold ' + (overallScore.score >= 80 ? 'text-amber-600' : overallScore.score >= 60 ? 'text-indigo-600' : 'text-gray-400')}>{overallScore.score + '点'}</div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap content-start items-center gap-1">
              {ev && ev.rokuyo && (
                <span className={'text-sm font-medium ' + (ROKUYO_COLORS[ev.rokuyo] || 'text-gray-500')}>{ev.rokuyo}</span>
              )}
              {ev && ev.lucky_days && ev.lucky_days.map((ld, j) => (
                <span key={'l' + j} className={'rounded-md border-2 px-1.5 py-0.5 text-xs font-bold ' + (LUCKY_DAY_COLORS[ld] || 'bg-indigo-100 text-indigo-800 border-indigo-300')}>{ld}</span>
              ))}
              {ev && ev.unlucky_days && ev.unlucky_days.map((ud, j) => (
                <span key={'u' + j} className={'rounded-md border px-1.5 py-0.5 text-xs font-medium ' + (UNLUCKY_COLORS[ud] || 'bg-gray-100 text-gray-500 border-gray-300')}>{ud}</span>
              ))}
              {ev && ev.lunar_phase && (
                <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700">{ev.lunar_phase}</span>
              )}
              {ev && ev.solar_term && (
                <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-800">{ev.solar_term}</span>
              )}
              {ev && ev.eto && (
                <span className="text-xs text-gray-400">{ev.eto}</span>
              )}
              {day.voidTimes.map((v, j) => (
                <span key={'v' + j} className="rounded-md border border-red-300 bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">{'VoC ' + formatVoidTime(v.start_at) + '-' + formatVoidTime(v.end_at)}</span>
              ))}
              {ev && ev.notes && (
                <span className="w-full text-xs font-bold text-pink-700">{ev.notes}</span>
              )}
              {!ev && day.voidTimes.length === 0 && (
                <span className="text-xs text-gray-300">{'—'}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
    </>
  )
}
