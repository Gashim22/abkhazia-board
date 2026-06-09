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
    .select(`id, title, price, photos, score, created_at,
             cities ( name ), categories ( name )`)
    .eq('status', 'active')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []
  return data as Listing[]
}

/* ─────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const [categories, listings] = await Promise.all([getCategories(), getListings()])

  return (
    <div style={{ margin: '0 -16px', marginTop: '-24px' }}>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, #0d3320 100%)',
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-montserrat), sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 44px)',
          color: '#fff',
          marginBottom: '10px',
          lineHeight: 1.15,
        }}>
          Доска объявлений Абхазии
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '17px', marginBottom: '32px' }}>
          Покупайте и продавайте легко
        </p>

        {/* Поиск в Hero */}
        <form action="/search" method="get"
              style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#9eb0a4" strokeWidth="2"
                 style={{ position: 'absolute', left: '18px', top: '50%',
                          transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input name="q" type="text"
                   placeholder="Что ищете?"
                   style={{
                     width: '100%',
                     padding: '16px 120px 16px 52px',
                     borderRadius: '16px',
                     border: 'none',
                     fontSize: '16px',
                     background: '#fff',
                     color: '#0f1a14',
                     boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                     outline: 'none',
                   }} />
            <button type="submit" style={{
              position: 'absolute', right: '8px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Найти
            </button>
          </div>
        </form>
      </section>

      {/* ══ КАТЕГОРИИ ═════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 40px' }}>

        {/* Заголовок секции */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: 'var(--font-montserrat), sans-serif',
            fontWeight: 700, fontSize: '22px',
            color: 'var(--text-primary)',
          }}>
            Категории
          </h2>
          <div style={{ flex: 1, height: '2px', background: 'var(--accent-light)',
                        borderRadius: '2px', maxWidth: '80px' }} />
        </div>

        {categories.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Категории не загружены.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>

      {/* ══ ОБЪЯВЛЕНИЯ ════════════════════════════════════════ */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 56px' }}>

        <div style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontFamily: 'var(--font-montserrat), sans-serif',
              fontWeight: 700, fontSize: '22px',
              color: 'var(--text-primary)',
            }}>
              Свежие объявления
            </h2>
            <div style={{ height: '2px', width: '80px', background: 'var(--accent-light)',
                          borderRadius: '2px' }} />
          </div>
          <Link href="/search?q=" style={{
            color: 'var(--accent)', fontSize: '14px', fontWeight: 500,
            textDecoration: 'none', transition: 'color 0.2s',
          }}>
            Все объявления →
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyListings />
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {listings.map((l) => (
                <ListingCard key={l.id} id={l.id} title={l.title} price={l.price}
                  photos={l.photos} score={l.score} createdAt={l.created_at}
                  city={l.cities?.[0]?.name ?? null}
                  category={l.categories?.[0]?.name ?? null} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/search?q=" className="btn-secondary">
                Показать больше
              </Link>
            </div>
          </>
        )}
      </section>

    </div>
  )
}

/* ─── Карточка категории ─────────────────────────────── */
function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
      <div className="group" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
        boxShadow: 'var(--shadow)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-3px)'
        el.style.borderColor = 'var(--accent)'
        el.style.background = 'var(--accent-light)'
        el.style.boxShadow = 'var(--shadow-hover)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--border)'
        el.style.background = 'var(--bg-card)'
        el.style.boxShadow = 'var(--shadow)'
      }}>
        {/* Иконка */}
        <div style={{
          width: '48px', height: '48px',
          background: 'var(--accent-light)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
          fontSize: '24px',
        }}>
          {cat.icon ?? '📦'}
        </div>

        {/* Название */}
        <p style={{
          marginTop: '12px',
          fontWeight: 600, fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        }}>
          {cat.name}
        </p>

        {/* Счётчик */}
        <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {cat.listings_count > 0 ? `${cat.listings_count} объявл.` : 'Нет'}
        </p>
      </div>
    </Link>
  )
}

/* ─── Пустые объявления ─────────────────────────────── */
function EmptyListings() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>📋</div>
      <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)',
                  marginBottom: '8px' }}>
        Объявлений пока нет
      </p>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Будьте первым — подайте объявление
      </p>
      <Link href="/create" className="btn-primary">
        Подать объявление
      </Link>
    </div>
  )
}
