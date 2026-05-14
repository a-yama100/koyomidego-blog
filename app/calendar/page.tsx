import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CalendarIndex() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  redirect('/calendar/' + year + '/' + month)
}
