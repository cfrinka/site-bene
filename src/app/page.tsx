import Container from '@/components/ui/Container'
import { H2 } from '@/components/ui/Typography'
import PageHeader from '@/components/content/PageHeader'
import PageBody from '@/components/content/PageBody'
import CollectionsGrid from '@/components/data/CollectionsGrid'
import ProductsGrid from '@/components/data/ProductsGrid'
// import CreatorsGrid from '@/components/data/CreatorsGrid'
import HomeSections from '@/components/content/HomeSections'
// import CreatorsFeatured from '@/components/content/CreatorsFeatured'

export default function HomePage() {
  return (
    <main>
      <HomeSections />
      <PageHeader page="home" />
      <Container className="py-6">
        <PageBody page="home" />
      </Container>


      {/* Featured Collections */}
      <section className="py-14">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <H2 size='text-5xl'>Coleções em destaque</H2>
          </div>
          <div className="mt-8">
            <CollectionsGrid limit={3} cols="sm:grid-cols-2 lg:grid-cols-3" />
          </div>
        </Container>
      </section>

      {/* Bestsellers */}
      <section className="py-14">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <H2 size='text-5xl'>Mais vendidos</H2>
          </div>
          <div className="mt-8">
            <ProductsGrid limit={4} cols="sm:grid-cols-2 lg:grid-cols-4" />
          </div>
        </Container>
      </section>

      {/* Creators (from Content DB -> featuredCreators) */}
      {/* <CreatorsFeatured dark /> */} {/* Disabled for now */}
    </main>
  )
}
