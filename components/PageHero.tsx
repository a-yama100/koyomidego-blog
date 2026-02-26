import { Container } from './Container'
interface PageHeroProps {
  title: string
  subtitle?: string
}
export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-indigo-950 text-white py-5">
      <Container>
        <h1 className="text-xl md:text-2xl font-bold text-center">{title}</h1>
        {subtitle && (
          <p className="text-sm text-indigo-200 text-center mt-1">{subtitle}</p>
        )}
      </Container>
    </section>
  )
}
