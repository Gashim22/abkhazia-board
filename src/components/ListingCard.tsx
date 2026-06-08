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

  if (diff < 60)       return 'только что'
  if (diff < 3600)     return `${Math.floor(diff / 60)} мин. назад`
  if (diff < 86400)    return `${Math.floor(diff / 3600)} ч. назад`
  if (diff < 2592000)  return `${Math.floor(diff / 86400)} дн. назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function ListingCard({
  id,
  title,
  price,
  photos,
  city,
  category,
  createdAt,
  score = 0,
}: ListingCardProps) {
  const isVip = score > 200
  const photo = photos?.[0] ?? null

  return (
    <Link
      href={`/listing/${id}`}
      className={`group flex flex-col bg-white rounded-xl overflow-hidden transition-all
                  hover:shadow-md hover:-translate-y-0.5
                  ${isVip
                    ? 'border-2 border-[#2d9e5f] shadow-sm shadow-[#2d9e5f]/20'
                    : 'border border-gray-100'
                  }`}
    >
      {/* Фото */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* VIP бейдж */}
        {isVip && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#1a6b3c] text-white
                           text-xs font-bold rounded-md shadow">
            VIP
          </span>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        {/* Цена */}
        <p className={`text-lg font-bold leading-tight
                       ${price ? 'text-[#1a6b3c]' : 'text-gray-400'}`}>
          {formatPrice(price)}
        </p>

        {/* Заголовок — максимум 2 строки */}
        <p className="text-sm text-gray-800 font-medium leading-snug
                      line-clamp-2 flex-1">
          {title}
        </p>

        {/* Город и категория */}
        {(city || category) && (
          <p className="text-xs text-gray-400 truncate mt-auto pt-1">
            {[city, category].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Дата */}
        <p className="text-xs text-gray-400">
          {timeAgo(createdAt)}
        </p>
      </div>
    </Link>
  )
}
