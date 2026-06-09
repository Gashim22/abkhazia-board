export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PhotoGallery from '@/components/PhotoGallery'
import ShowPhoneButton from '@/components/ShowPhoneButton'
import ListingTabs from '@/components/ListingTabs'
import ListingCard from '@/components/ListingCard'
import ReportButton from '@/components/ReportButton'
import ListingOwnerPanel from '@/components/ListingOwnerPanel'

interface PageProps {
  params: { id: string }
}

function formatPrice(price: number | null) {
  if (!price) return 'Договорная'
  return price.toLocaleString('ru-RU') + ' ₽'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function getData(id: string) {
  const supabase = createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, title, description, price, photos, score,
      views_count, phone_views_count, created_at, status,
      category_id, city_id, user_id,
      cities      ( name ),
      categories  ( id, name, slug ),
      profiles    ( name, avatar_url, created_at, phone )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!listing) return null

  // Инкрементируем просмотры (silent fail если функция не создана)
  await supabase.rpc('increment_listing_views', { listing_id: id })

  // Другие объявления продавца
  const { data: sellerListings } = await supabase
    .from('listings')
    .select(`
      id, title, price, photos, score, created_at,
      cities     ( name ),
      categories ( name )
    `)
    .eq('user_id', listing.user_id)
    .eq('status', 'active')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(4)

  // Похожие объявления (из той же категории)
  const { data: similarListings } = await supabase
    .from('listings')
    .select(`
      id, title, price, photos, score, created_at,
      cities     ( name ),
      categories ( name )
    `)
    .eq('category_id', listing.category_id)
    .eq('status', 'active')
    .neq('id', id)
    .order('score',      { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  return { listing, sellerListings: sellerListings ?? [], similarListings: similarListings ?? [] }
}

export default async function ListingPage({ params }: PageProps) {
  const data = await getData(params.id)
  if (!data) notFound()

  const { listing, sellerListings, similarListings } = data

  const city     = (listing.cities     as { name: string }[] | null)?.[0]?.name
  const category = (listing.categories as { id: number; name: string; slug: string }[] | null)?.[0]
  const profile  = (listing.profiles   as { name: string | null; avatar_url: string | null; created_at: string; phone: string | null }[] | null)?.[0]

  const characteristics = [
    { label: 'Категория',    value: category?.name ?? '—' },
    { label: 'Город',        value: city ?? '—' },
    { label: 'Цена',         value: formatPrice(listing.price) },
    { label: 'Дата подачи',  value: formatDate(listing.created_at) },
    { label: 'Просмотров',   value: String(listing.views_count + 1) },
  ]

  return (
    <div>
      {/* Панель владельца */}
      <ListingOwnerPanel listingId={listing.id} authorId={listing.user_id} />

      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-[#1a6b3c] transition-colors">Главная</Link>
        <span>›</span>
        {category && (
          <>
            <Link href={`/category/${category.slug}`}
                  className="hover:text-[#1a6b3c] transition-colors">
              {category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-700 line-clamp-1">{listing.title}</span>
      </nav>

      {/* Основная сетка */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Левая колонка (70%) ─────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Галерея */}
          <PhotoGallery photos={listing.photos} title={listing.title} />

          {/* Заголовок + цена */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
              {listing.title}
            </h1>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-3xl font-bold text-[#1a6b3c]">
                {formatPrice(listing.price)}
              </p>
              <button
                className="px-5 py-2 border-2 border-[#1a6b3c] text-[#1a6b3c] text-sm
                           font-medium rounded-xl hover:bg-[#1a6b3c] hover:text-white
                           transition-colors"
              >
                Сделать предложение
              </button>
            </div>

            {/* Метаданные */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              {city && <span>📍 {city}</span>}
              <span>📅 {formatDate(listing.created_at)}</span>
              <span>👁 {listing.views_count + 1} просмотров</span>
              {listing.score > 200 && (
                <span className="px-2 py-0.5 bg-[#1a6b3c] text-white rounded-md font-bold">
                  VIP
                </span>
              )}
            </div>
          </div>

          {/* Вкладки: описание / характеристики */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <ListingTabs
              description={listing.description}
              characteristics={characteristics}
            />
          </div>
        </div>

        {/* ── Правая колонка (30%) ─────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">

          {/* Карточка продавца */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Продавец
            </h3>

            <div className="flex items-center gap-3 mb-5">
              {/* Аватар */}
              <div className="w-12 h-12 rounded-full bg-[#f4f7f5] border border-gray-200
                              flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Аватар" // eslint-disable-line @next/next/no-img-element
                         className="w-full h-full object-cover" />
                  : '👤'
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {profile?.name ?? 'Пользователь'}
                </p>
                {profile?.created_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    На сайте с {formatDate(profile.created_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Кнопка телефона */}
            <ShowPhoneButton
              phone={profile?.phone ?? null}
              listingId={listing.id}
            />

            {/* Написать сообщение */}
            <button
              disabled
              className="w-full mt-3 py-3 rounded-xl text-sm font-medium
                         bg-gray-100 text-gray-400 cursor-not-allowed"
              title="Будет доступно в следующем обновлении"
            >
              💬 Написать сообщение
            </button>

            {/* Пожаловаться */}
            <div className="text-center mt-4">
              <ReportButton listingId={listing.id} />
            </div>
          </div>

          {/* Блок безопасности */}
          <div className="bg-[#f4f7f5] rounded-xl border border-green-100 p-4">
            <h3 className="text-sm font-semibold text-[#1a6b3c] mb-3 flex items-center gap-2">
              🛡 Безопасная сделка
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Встречайтесь в людных местах
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Проверяйте товар перед оплатой
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Не переводите деньги заранее
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Берите чек или расписку
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Другие объявления продавца ───────────────────────── */}
      {sellerListings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Другие объявления продавца
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sellerListings.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                title={l.title}
                price={l.price}
                photos={l.photos}
                score={l.score}
                createdAt={l.created_at}
                city={(l.cities     as { name: string }[] | null)?.[0]?.name ?? null}
                category={(l.categories as { name: string }[] | null)?.[0]?.name ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Похожие объявления ───────────────────────────────── */}
      {similarListings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Похожие объявления
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarListings.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                title={l.title}
                price={l.price}
                photos={l.photos}
                score={l.score}
                createdAt={l.created_at}
                city={(l.cities     as { name: string }[] | null)?.[0]?.name ?? null}
                category={(l.categories as { name: string }[] | null)?.[0]?.name ?? null}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
