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
      <nav style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <Link href="/" className="breadcrumb-link">Главная</Link>
        <span>›</span>
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="breadcrumb-link">
              {category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span style={{ color: 'var(--text-primary)' }}>{listing.title}</span>
      </nav>

      {/* Основная сетка */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Левая колонка (70%) ─────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Галерея */}
          <PhotoGallery photos={listing.photos} title={listing.title} />

          {/* Заголовок + цена */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
                         marginBottom: '12px', lineHeight: 1.3 }}>
              {listing.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '16px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--accent)' }}>
                {formatPrice(listing.price)}
              </p>
              <button className="btn-offer">
                Сделать предложение
              </button>
            </div>

            {/* Метаданные */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px',
                          marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)',
                          flexWrap: 'wrap' }}>
              {city && <span>📍 {city}</span>}
              <span>📅 {formatDate(listing.created_at)}</span>
              <span>👁 {listing.views_count + 1} просмотров</span>
              {listing.score > 200 && (
                <span style={{ padding: '2px 8px', background: 'var(--accent)',
                               color: '#fff', borderRadius: '6px', fontWeight: 700 }}>
                  VIP
                </span>
              )}
            </div>
          </div>

          {/* Вкладки: описание / характеристики */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '12px', padding: '20px' }}>
            <ListingTabs
              description={listing.description}
              characteristics={characteristics}
            />
          </div>
        </div>

        {/* ── Правая колонка (30%) ─────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">

          {/* Карточка продавца */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                         textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Продавец
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              {/* Аватар */}
              <div style={{ width: '48px', height: '48px', borderRadius: '50%',
                            background: 'var(--accent-light)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', flexShrink: 0, overflow: 'hidden' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Аватар" // eslint-disable-line @next/next/no-img-element
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '👤'
                }
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                  {profile?.name ?? 'Пользователь'}
                </p>
                {profile?.created_at && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
              style={{ width: '100%', marginTop: '12px', padding: '12px',
                       borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                       background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                       cursor: 'not-allowed', border: '1px solid var(--border)' }}
              title="Будет доступно в следующем обновлении"
            >
              💬 Написать сообщение
            </button>

            {/* Пожаловаться */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <ReportButton listingId={listing.id} />
            </div>
          </div>

          {/* Блок безопасности */}
          <div style={{ background: 'var(--accent-light)', borderRadius: '16px',
                        border: '1px solid var(--border)', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
                         marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡 Безопасная сделка
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px',
                         fontSize: '12px', color: 'var(--text-secondary)', listStyle: 'none',
                         padding: 0, margin: 0 }}>
              {['Встречайтесь в людных местах',
                'Проверяйте товар перед оплатой',
                'Не переводите деньги заранее',
                'Берите чек или расписку'].map(tip => (
                <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', marginTop: '1px' }}>✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Другие объявления продавца ───────────────────────── */}
      {sellerListings.length > 0 && (
        <section className="mt-10">
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
                       marginBottom: '16px' }}>
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
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
                       marginBottom: '16px' }}>
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
