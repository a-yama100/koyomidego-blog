import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function cachedJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'overall'
  const months = parseInt(searchParams.get('months') || '3')

  const now = new Date()
  const startDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')

  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + months)
  const endStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0')

  const sc = createServiceClient()

  const [scoresRes, eventsRes, voidsRes] = await Promise.all([
    sc.from('koyomi_scores')
      .select('*')
      .eq('category', category)
      .gte('date', startDate)
      .lte('date', endStr)
      .order('score', { ascending: false })
      .limit(30),
    sc.from('koyomi_events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endStr),
    sc.from('koyomi_void_times')
      .select('*')
      .gte('start_at', startDate + 'T00:00:00+09:00')
      .lte('start_at', endStr + 'T23:59:59+09:00'),
  ])

  const scores = scoresRes.data || []
  const events = eventsRes.data || []
  const voids = voidsRes.data || []

  const days = scores.map((s: any) => {
    const event = events.find((e: any) => e.date === s.date)
    const dayVoids = voids.filter((v: any) => {
      const vStart = v.start_at.substring(0, 10)
      const vEnd = v.end_at.substring(0, 10)
      return vStart === s.date || vEnd === s.date
    })
    const hasVoid = dayVoids.length > 0
    let voidInfo = ''
    if (hasVoid && dayVoids[0]) {
      const st = new Date(dayVoids[0].start_at)
      const en = new Date(dayVoids[0].end_at)
      voidInfo = String(st.getHours()).padStart(2, '0') + ':' + String(st.getMinutes()).padStart(2, '0')
        + '-' + String(en.getHours()).padStart(2, '0') + ':' + String(en.getMinutes()).padStart(2, '0')
    }
    return {
      date: s.date,
      score: s.score,
      reason: s.reason,
      event,
      hasVoid,
      voidInfo,
    }
  })

  return cachedJson({ days })
}
