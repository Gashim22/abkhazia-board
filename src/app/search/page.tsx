export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'

interface SearchPageProps {
  searchParams: { q?: string }
}

async function searchListings(query: string) {
  const supabase = createClient()
  const q = query.trim()

  if (!q) return { listings: [], total: 0 }

  const { data, count, error } = await supabase
    .from('listings')
    .select(`
      id, title, price, photos, score, created_at,
      cities      ( name ),
      categories  ( name )
    `, { count: 'exact' })
    .eq('status', 'active')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order('score',      { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) return { listings: [], total: 0 }
  return { listings: data ?? [], total: count ?? 0 }
}

// Склонение слова «объявление»
function pluralize(n: number) {
  const mod10  = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19)       return 'объявлений'
  if (mod10 === 1)                         return 'объявление'
  if (mod10 >= 2 && mod10 <= 4)            return 'объявления'
  return 'объявлений'
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = (searchParams.q ?? '').trim()
  const { listings, total } = q
    ? await searchListings(q)
    : { listings: [], total: 0 }

  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-[#1a6b3c] transition-colors">
          Главная
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Поиск</span>
        {q && (
          <>
            <span className="mx-2">›</span>
            <span className="text-gray-700">{q}</span>
          </>
        )}
      </nav>

      {/* Заголовок с результатом */}
      <div className="mb-6">
        {q ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              Поиск:{' '}
              <span className="text-[#1a6b3c]">«{q}»</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {total > 0
                ? `Найдено ${total} ${pluralize(total)}`
                : 'По запросу ничего не найдено'}
            </p>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">Поиск</h1>
        )}
      </div>

      {/* Пустой запрос */}
      {!q && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium text-gray-600">
            Введите запрос в строку поиска
          </p>
        </div>
      )}

      {/* Нет результатов */}
      {q && listings.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">😔</p>
          <p className="text-lg font-medium text-gray-600">
            По запросу «{q}» ничего не найдено
          </p>
          <p className="text-sm mt-1">
            Попробуйте другие слова или проверьте написание
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2 border border-[#1a6b3c] text-[#1a6b3c]
                       text-sm rounded-lg hover:bg-[#1a6b3c] hover:text-white transition-colors"
          >
            На главную
          </Link>
        </div>
      )}

      {/* Результаты */}
      {listings.length > 0 && (
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
              city={
                (listing.cities as { name: string }[] | null)?.[0]?.name ?? null
              }
              category={
                (listing.categories as { name: string }[] | null)?.[0]?.name ?? null
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
