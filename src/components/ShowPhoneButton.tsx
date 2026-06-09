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
      <p style={{ fontSize: '14px', color: 'var(--text-muted)',
                  textAlign: 'center', padding: '8px 0' }}>
        Телефон не указан
      </p>
    )
  }

  return (
    <button
      onClick={handleReveal}
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        fontWeight: 500,
        fontSize: revealed ? '18px' : '14px',
        letterSpacing: revealed ? '0.05em' : 'normal',
        cursor: revealed ? 'default' : 'pointer',
        border: revealed ? '1px solid var(--accent)' : 'none',
        background: revealed ? 'var(--accent-light)' : 'var(--accent)',
        color: revealed ? 'var(--accent)' : '#fff',
        transition: 'all 0.2s ease',
      }}
    >
      {loading ? 'Загрузка...' : revealed ? phone : '📞 Показать номер'}
    </button>
  )
}
