import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'

const MOCK_LISTINGS = [
  {
    id: 'mock-1',
    title: 'Toyota Camry 2020, отличное состояние, один хозяин',
    price: 2500000,
    photos: [],
    city: 'Сухум',
    category: 'Авто',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    score: 250,
  },
  {
    id: 'mock-2',
    title: 'Квартира 2-комнатная, центр Гагры, вид на море',
    price: 4800000,
    photos: [],
    city: 'Гагра',
    category: 'Недвижимость',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    score: 0,
  },
  {
    id: 'mock-3',
    title: 'iPhone 15 Pro 256GB, Space Black, полный комплект',
    price: 89000,
    photos: [],
    city: 'Сухум',
    category: 'Электроника',
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    score: 0,
  },
  {
    id: 'mock-4',
    title: 'Диван угловой, ткань, почти новый',
    price: null,
    photos: [],
    city: 'Очамчыра',
    category: 'Мебель',
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    score: 0,
  },
]

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  listings_count: number
}

async function getCategories(): Promise<Category[]> {
  const supabase = createClient()

  // Загружаем категории верхнего уровня
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .is('parent_id', null)
    .order('sort_order')

  if (error || !categories) return []

  // Считаем активные объявления по каждой категории
  const { data: counts } = await supabase
    .from('listings')
    .select('category_id')
    .eq('status', 'active')

  const countMap: Record<number, number> = {}
  counts?.forEach(({ category_id }) => {
    if (category_id) countMap[category_id] = (countMap[category_id] ?? 0) + 1
  })

  return categories.map((cat) => ({
    ...cat,
    listings_count: countMap[cat.id] ?? 0,
  }))
}

export default async function HomePage() {
  const categories = await getCategories()

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MOCK_LISTINGS.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </section>

    </div>
  )
}
