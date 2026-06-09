export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import CategoryFilters from '@/components/CategoryFilters'

const PAGE_SIZE = 20

interface SearchParams {
  city?:       string
  price_from?: string
  price_to?:   string
  sort?:       string
  page?:       string
}

interface PageProps {
  params:       { slug: string }
  searchParams: SearchParams
}

async function getData(slug: string, sp: SearchParams) {
  const supabase = createClient()
  const page     = Math.max(1, parseInt(sp.page ?? '1'))
  const from     = (page - 1) * PAGE_SIZE
  const to       = from + PAGE_SIZE - 1

  // Категория
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .eq('slug', slug)
    .single()

  if (!category) return null

  // Города для фильтра
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug')
    .order('name')

  // Запрос объявлений с фильтрами
  let query = supabase
    .from('listings')
    .select(`
      id, title, price, photos, score, created_at,
      cities ( name ),
      categories ( name )
    `, { count: 'exact' })
    .eq('status', 'active')
    .eq('category_id', category.id)

  // Фильтр по городу
  if (sp.city) {
    const { data: cityRow } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', sp.city)
      .single()
    if (cityRow) query = query.eq('city_id', cityRow.id)
  }

  // Фильтр по цене
  if (sp.price_from) query = query.gte('price', Number(sp.price_from))
  if (sp.price_to)   query = query.lte('price', Number(sp.price_to))

  // Сортировка
  switch (sp.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'score':
      query = query.order('score', { ascending: false })
      break
    default: // newest
      query = query
        .order('score',      { ascending: false })
        .order('created_at', { ascending: false })
  }

  const { data: listings, count } = await query.range(from, to)

  return {
    category,
    cities:   cities ?? [],
    listings: listings ?? [],
    total:    count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

// Строим URL с изменённым параметром page, сохраняя остальные
function pageUrl(
  slug: string,
  sp: SearchParams,
  targetPage: number
) {
  const params = new URLSearchParams()
  if (sp.city)       params.set('city',       sp.city)
  if (sp.price_from) params.set('price_from', sp.price_from)
  if (sp.price_to)   params.set('price_to',   sp.price_to)
  if (sp.sort)       params.set('sort',        sp.sort)
  if (targetPage > 1) params.set('page',       String(targetPage))
  const qs = params.toString()
  return `/category/${slug}${qs ? `?${qs}` : ''}`
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const data = await getData(params.slug, searchParams)
  if (!data) notFound()

  const { category, cities, listings, total, page, totalPages } = data

  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-[#1a6b3c] transition-colors">Главная</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{category.name}</span>
      </nav>

      {/* Заголовок категории */}
      <div className="flex items-center gap-3 mb-6">
        {category.icon && (
          <span className="text-4xl leading-none">{category.icon}</span>
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-montserrat)' }}>{category.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {total > 0 ? `${total} объявлений` : 'Нет объявлений'}
          </p>
        </div>
      </div>

      {/* Фильтры — Client Component */}
      <Suspense fallback={null}>
        <CategoryFilters cities={cities} />
      </Suspense>

      {/* Список объявлений */}
      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium text-gray-600">Объявлений не найдено</p>
          <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
          <Link
            href={`/category/${params.slug}`}
            className="inline-block mt-6 px-5 py-2 border border-[#1a6b3c] text-[#1a6b3c]
                       text-sm rounded-lg hover:bg-[#1a6b3c] hover:text-white transition-colors"
          >
            Сбросить фильтры
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
                city={(listing.cities as { name: string }[] | null)?.[0]?.name ?? null}
                category={(listing.categories as { name: string }[] | null)?.[0]?.name ?? null}
              />
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {/* Назад */}
              {page > 1 && (
                <Link
                  href={pageUrl(params.slug, searchParams, page - 1)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                             hover:border-[#2d9e5f] hover:text-[#1a6b3c] transition-colors"
                >
                  ← Назад
                </Link>
              )}

              {/* Страницы */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={pageUrl(params.slug, searchParams, p as number)}
                      className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg
                                  transition-colors border
                                  ${p === page
                                    ? 'bg-[#1a6b3c] text-white border-[#1a6b3c]'
                                    : 'border-gray-200 hover:border-[#2d9e5f] hover:text-[#1a6b3c]'
                                  }`}
                    >
                      {p}
                    </Link>
                  )
                )}

              {/* Вперёд */}
              {page < totalPages && (
                <Link
                  href={pageUrl(params.slug, searchParams, page + 1)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                             hover:border-[#2d9e5f] hover:text-[#1a6b3c] transition-colors"
                >
                  Вперёд →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
