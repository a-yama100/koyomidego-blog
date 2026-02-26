import { BestDaysView } from '@/components/BestDaysView'
import { Container } from '@/components/Container'

export const metadata = {
  title: '吉日一覧 - 行動別おすすめ日',
  description: '起業・引越・口座開設・結婚など、行動別に最適な吉日を探せます。',
}

export default function BestDaysPage() {
  return (
    <>
      <section className="bg-indigo-950 text-white py-10">
        <Container>
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            {'吉日一覧'}
          </h1>
          <p className="text-indigo-200 text-center mt-2">
            {'行動別に最適な日を探せます'}
          </p>
        </Container>
      </section>
      <Container className="py-8">
        <BestDaysView />
      </Container>
    </>
  )
}
