'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function YearMonthPicker() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const router = useRouter()

  const years: number[] = []
  for (let y = today.getFullYear() - 1; y <= today.getFullYear() + 2; y++) {
    years.push(y)
  }

  const go = () => {
    router.push('/calendar/' + year + '/' + String(month).padStart(2, '0'))
  }

  return (
    <div className="flex items-center gap-3 justify-center">
      <select
        value={year}
        onChange={e => setYear(Number(e.target.value))}
        className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
      >
        {years.map(y => (
          <option key={y} value={y}>{y + '年'}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={e => setMonth(Number(e.target.value))}
        className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
      >
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
          <option key={m} value={m}>{m + '月'}</option>
        ))}
      </select>
      <button
        onClick={go}
        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
      >
        {'見る'}
      </button>
    </div>
  )
}
