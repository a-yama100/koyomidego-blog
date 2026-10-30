// 受け口（問い合わせ・登録・予約など）の回数制限。
// まず DB の関数 rate_limit_hit（全サーバーで共通の数え方）で数え、関数が無い・DB に届かないときは
// このサーバーの記憶だけで数える（サーバーごとの数え方なので弱いが、無いよりはよい）。
import type { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

type Bucket = { hits: number[] }
const memory = new Map<string, Bucket>()

function memoryHit(key: string, windowSec: number, max: number): boolean {
  const now = Date.now()
  const since = now - windowSec * 1000
  const b = memory.get(key) || { hits: [] }
  b.hits = b.hits.filter((t) => t > since)
  if (b.hits.length >= max) {
    memory.set(key, b)
    return false
  }
  b.hits.push(now)
  memory.set(key, b)
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (!v.hits.some((t) => t > since)) memory.delete(k)
  }
  return true
}

export function clientIp(request: NextRequest): string {
  const h = request.headers
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}

// true なら通してよい、false なら上限に達している。
export async function rateLimit(key: string, windowSec: number, max: number): Promise<boolean> {
  const site = process.env.NEXT_PUBLIC_SITE_ID || "site"
  const fullKey = site + ":" + key
  const local = memoryHit(fullKey, windowSec, max)
  try {
    const sc = createServiceClient()
    const { data, error } = await sc.rpc("rate_limit_hit", {
      p_key: fullKey,
      p_window_seconds: windowSec,
      p_max: max,
    })
    if (error) return local
    return data === true
  } catch {
    return local
  }
}

export const TOO_MANY = { error: "送信が多すぎます。しばらく時間をおいてからお試しください。 / Too many requests. Please try again later." }
