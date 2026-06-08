'use client'

import { useState } from 'react'

interface ShowPhoneButtonProps {
  phone: string | null
  listingId: string
}

export default function ShowPhoneButton({ phone, listingId }: ShowPhoneButtonProps) {
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReveal() {
    if (revealed || !phone) return
    setLoading(true)
    // Инкрементируем счётчик звонков
    await fetch(`/api/listing/${listingId}/phone-view`, { method: 'POST' })
    setRevealed(true)
    setLoading(false)
  }

  if (!phone) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        Телефон не указан
      </p>
    )
  }

  return (
    <button
      onClick={handleReveal}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-medium text-sm transition-all
                  ${revealed
                    ? 'bg-[#f4f7f5] text-[#1a6b3c] border border-[#2d9e5f] text-lg tracking-wider cursor-default'
                    : 'bg-[#1a6b3c] text-white hover:bg-[#2d9e5f] active:scale-95'
                  }`}
    >
      {loading
        ? 'Загрузка...'
        : revealed
          ? phone
          : '📞 Показать номер'
      }
    </button>
  )
}
