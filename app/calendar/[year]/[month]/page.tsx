import { CalendarView } from '@/components/CalendarView'

interface Props {
  params: Promise<{ year: string; month: string }>
}

export async function generateMetadata({ params }: Props) {
  const { year, month } = await params
  return {
    title: year + '年' + month + '月の吉日カレンダー',
    description: year + '年' + month + '月の吉日・ボイドタイムをカレンダーで確認',
  }
}

export default async function CalendarPage({ params }: Props) {
  const { year, month } = await params
  return <CalendarView initialYear={parseInt(year)} initialMonth={parseInt(month)} />
}
