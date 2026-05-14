'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Props {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

/**
 * 「今月の」カレンダーへ遷移する Link。
 * SSR/hydration 後に useEffect でクライアントの現在年月を反映させ、
 * CDN キャッシュで href が古くなっても初回描画後に正しいURLへ更新される。
 */
export function CurrentMonthLink({ className, children, onClick }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  useEffect(() => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }, [])

  const href = '/calendar/' + year + '/' + String(month).padStart(2, '0')

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
