'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PhotoGalleryProps {
  photos: string[]
  title: string
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0)

  const hasPhotos = photos && photos.length > 0

  function prev() {
    setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1))
  }

  function next() {
    setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1))
  }

  if (!hasPhotos) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex items-center
                      justify-center text-gray-300 mb-4">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="mb-4">
      {/* Главное фото */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        <Image
          src={photos[current]}
          alt={`${title} — фото ${current + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 70vw"
          className="object-cover"
          priority={current === 0}
        />

        {/* Счётчик */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white
                          text-xs px-2 py-1 rounded-lg">
            {current + 1} / {photos.length}
          </div>
        )}

        {/* Стрелки */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80
                         hover:bg-white rounded-full flex items-center justify-center
                         shadow transition-colors"
              aria-label="Предыдущее фото"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80
                         hover:bg-white rounded-full flex items-center justify-center
                         shadow transition-colors"
              aria-label="Следующее фото"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Миниатюры */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2
                          transition-colors
                          ${i === current
                            ? 'border-[#2d9e5f]'
                            : 'border-transparent hover:border-gray-300'
                          }`}
            >
              <Image
                src={photo}
                alt={`Миниатюра ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
