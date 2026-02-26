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
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

  const startDate = year + '-' + String(month).padStart(2, '0') + '-01'
  const endDate = month === 12
    ? (year + 1) + '-01-01'
    : year + '-' + String(month + 1).padStart(2, '0') + '-01'

  const sc = createServiceClient()

  const [eventsRes, scoresRes, voidRes] = await Promise.all([
    sc.from('koyomi_events')
      .select('*')
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date'),
    sc.from('koyomi_scores')
      .select('*')
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date'),
    sc.from('koyomi_void_times')
      .select('*')
      .gte('start_at', startDate + 'T00:00:00+09:00')
      .lt('start_at', endDate + 'T00:00:00+09:00')
      .order('start_at'),
  ])

  return cachedJson({
    events: eventsRes.data || [],
    scores: scoresRes.data || [],
    voidTimes: voidRes.data || [],
    year,
    month,
  })
}
