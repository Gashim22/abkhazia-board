'use client'

import Link from 'next/link'
import Image from 'next/image'

interface ListingCardProps {
  id: string
  title: string
  price: number | null
  photos: string[]
  city?: string | null
  category?: string | null
  createdAt: string
  score?: number
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return 'Договорная'
  return price.toLocaleString('ru-RU') + ' ₽'
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)      return 'только что'
  if (diff < 3600)    return `${Math.floor(diff / 60)} мин. назад`
  if (diff < 86400)   return `${Math.floor(diff / 3600)} ч. назад`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} дн. назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function ListingCard({
  id, title, price, photos, city, category, createdAt, score = 0,
}: ListingCardProps) {
  const isVip = score > 200
  const photo = photos?.[0] ?? null

  return (
    <Link href={`/listing/${id}`} className="group block" style={{ textDecoration: 'none' }}>
      <article
        style={{
          background:    'var(--bg-card)',
          border:        isVip ? '2px solid var(--accent)' : '1px solid var(--border)',
          borderRadius:  '16px',
          boxShadow:     'var(--shadow)',
          overflow:      'hidden',
          transition:    'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        className="group-hover:-translate-y-1"
        onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
      >
        {/* Фото */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {photo ? (
            <Image src={photo} alt={title} fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
                 style={{ background: 'var(--accent-light)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                   stroke="var(--text-muted)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}

          {/* Градиент снизу */}
          {photo && (
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                 style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }} />
          )}

          {/* Цена поверх фото */}
          {photo && (
            <div className="absolute bottom-2 left-3">
              <span className="text-white text-sm font-bold drop-shadow">
                {formatPrice(price)}
              </span>
            </div>
          )}

          {/* VIP бейдж */}
          {isVip && (
            <span className="absolute top-2 left-2 px-2.5 py-1 text-xs font-bold rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                  }}>
              VIP
            </span>
          )}
        </div>

        {/* Контент */}
        <div className="p-3 flex flex-col gap-1">
          {/* Цена (если нет фото) */}
          {!photo && (
            <p className="text-base font-bold" style={{ color: price ? 'var(--accent)' : 'var(--text-muted)' }}>
              {formatPrice(price)}
            </p>
          )}

          {/* Заголовок */}
          <p className="text-sm font-semibold leading-snug line-clamp-2"
             style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>

          {/* Город · Категория */}
          {(city || category) && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {[city, category].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Дата */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(createdAt)}
          </p>
        </div>
      </article>
    </Link>
  )
}
