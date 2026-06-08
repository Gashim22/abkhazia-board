'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface City {
  id: number
  name: string
  slug: string
}

interface CategoryFiltersProps {
  cities: City[]
}

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc',label: 'Дороже' },
  { value: 'score',     label: 'По рейтингу' },
]

export default function CategoryFilters({ cities }: CategoryFiltersProps) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  // Обновляем один параметр, сбрасывая страницу пагинации
  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // при смене фильтра возвращаемся на стр. 1
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const city       = searchParams.get('city')       ?? ''
  const priceFrom  = searchParams.get('price_from') ?? ''
  const priceTo    = searchParams.get('price_to')   ?? ''
  const sort       = searchParams.get('sort')       ?? 'newest'

  const hasFilters = city || priceFrom || priceTo || sort !== 'newest'

  function reset() {
    router.push(pathname)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-end">

        {/* Город */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-gray-500 font-medium">Город</label>
          <select
            value={city}
            onChange={(e) => setParam('city', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20
                       bg-white cursor-pointer"
          >
            <option value="">Все города</option>
            {cities.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Цена от */}
        <div className="flex flex-col gap-1 w-[110px]">
          <label className="text-xs text-gray-500 font-medium">Цена от</label>
          <input
            type="number"
            placeholder="0"
            value={priceFrom}
            min={0}
            onChange={(e) => setParam('price_from', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20"
          />
        </div>

        {/* Цена до */}
        <div className="flex flex-col gap-1 w-[110px]">
          <label className="text-xs text-gray-500 font-medium">Цена до</label>
          <input
            type="number"
            placeholder="∞"
            value={priceTo}
            min={0}
            onChange={(e) => setParam('price_to', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20"
          />
        </div>

        {/* Сортировка */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs text-gray-500 font-medium">Сортировка</label>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20
                       bg-white cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Сброс */}
        {hasFilters && (
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-gray-500 hover:text-[#1a6b3c]
                       border border-gray-200 rounded-lg hover:border-[#2d9e5f]
                       transition-colors self-end"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
