export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  listings_count: number
}

interface Listing {
  id: string
  title: string
  price: number | null
  photos: string[]
  score: number
  created_at: string
  cities: { name: string }[] | null
  categories: { name: string }[] | null
}

async function getCategories(): Promise<Category[]> {
  const supabase = createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .is('parent_id', null)
    .order('sort_order')

  if (error || !categories) return []

  // Считаем точное количество для каждой категории отдельным count-запросом
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('status', 'active')
      return { ...cat, listings_count: count ?? 0 }
    })
  )

  return categoriesWithCount
}

async function getListings(): Promise<Listing[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      price,
      photos,
      score,
      created_at,
      cities ( name ),
      categories ( name )
    `)
    .eq('status', 'active')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []
  return data as Listing[]
}

export default async function HomePage() {
  const [categories, listings] = await Promise.all([
    getCategories(),
    getListings(),
  ])

  return (
    <div className="-mx-4 -mt-6">

      {/* ── Блок 1: Hero ─────────────────────────────────────── */}
      <section
        className="px-4 py-16 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #1a6b3c 0%, #2d9e5f 50%, #1a6b3c 100%)',
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-sm">
          Доска объявлений Абхазии
        </h1>
        <p className="text-lg md:text-xl text-white/85 mb-8">
          Покупайте и продавайте легко
        </p>
        <Link
          href="/listings/new"
          className="inline-block px-8 py-3 bg-white text-[#1a6b3c] font-semibold
                     rounded-xl hover:bg-gray-50 transition-colors shadow-md"
        >
          Подать объявление
        </Link>
      </section>

      {/* ── Блок 2: Категории ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Категории</h2>

        {categories.length === 0 ? (
          <p className="text-gray-400">Категории не загружены.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100
                           hover:border-[#2d9e5f] hover:shadow-md transition-all group"
              >
                <span className="text-4xl leading-none">{cat.icon ?? '📦'}</span>
                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-[#1a6b3c] leading-tight">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">
                  {cat.listings_count > 0
                    ? `${cat.listings_count} объявл.`
                    : 'Нет объявлений'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Блок 3: Свежие объявления ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Свежие объявления</h2>
          <Link
            href="/listings"
            className="text-sm text-[#2d9e5f] hover:text-[#1a6b3c] font-medium transition-colors"
          >
            Смотреть все →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg font-medium">Объявлений пока нет</p>
            <p className="text-sm mt-1">Будьте первым — подайте объявление</p>
            <Link
              href="/listings/new"
              className="inline-block mt-6 px-6 py-2 bg-[#1a6b3c] text-white
                         text-sm font-medium rounded-lg hover:bg-[#2d9e5f] transition-colors"
            >
              Подать объявление
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  photos={listing.photos}
                  score={listing.score}
                  createdAt={listing.created_at}
                  city={listing.cities?.[0]?.name ?? null}
                  category={listing.categories?.[0]?.name ?? null}
                />
              ))}
            </div>

            {/* Кнопка «Показать больше» */}
            <div className="text-center mt-10">
              <Link
                href="/listings"
                className="inline-block px-8 py-3 border-2 border-[#1a6b3c] text-[#1a6b3c]
                           font-medium rounded-xl hover:bg-[#1a6b3c] hover:text-white
                           transition-colors"
              >
                Показать больше
              </Link>
            </div>
          </>
        )}
      </section>

    </div>
  )
}
