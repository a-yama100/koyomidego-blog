import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit, clientIp, TOO_MANY } from '@/lib/security/rateLimit'

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
  // 回数制限: 同じ IP から 1 分に 60 回まで（読み取りだけだが、DB を叩き続けられないように）
  if (!(await rateLimit('calendar:ip:' + clientIp(request), 60, 60))) {
    return NextResponse.json(TOO_MANY, { status: 429 })
  }
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  // 受け付ける値の幅
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: '年月の指定が正しくありません。' }, { status: 400 })
  }

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
