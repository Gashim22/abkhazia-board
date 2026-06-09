'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ListingOwnerPanel({
  listingId,
  authorId,
}: {
  listingId: string
  authorId:  string
}) {
  const router   = useRouter()
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === authorId) setIsOwner(true)
    })
  }, [authorId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOwner) return null

  async function handleArchive() {
    setLoading(true)
    await supabase
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', listingId)
    router.push('/profile')
    router.refresh()
  }

  async function handleDelete() {
    const ok = window.confirm('Вы уверены? Объявление будет удалено навсегда.')
    if (!ok) return
    setLoading(true)
    await supabase.from('listings').delete().eq('id', listingId)
    alert('Объявление удалено')
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      background:   'var(--accent-light)',
      border:       '1px solid var(--border)',
      borderRadius: '12px',
      padding:      '14px 16px',
      marginBottom: '20px',
      display:      'flex',
      gap:          '10px',
      flexWrap:     'wrap',
      alignItems:   'center',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '4px' }}>
        Ваше объявление:
      </span>

      <button
        onClick={() => router.push(`/edit/${listingId}`)}
        disabled={loading}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '7px 14px',
          borderRadius: '8px',
          border:       '1px solid var(--border)',
          background:   'var(--bg-card)',
          color:        'var(--text-primary)',
          fontSize:     '13px',
          fontWeight:   500,
          cursor:       'pointer',
          transition:   'all 0.15s ease',
        }}
      >
        ✏️ Редактировать
      </button>

      <button
        onClick={handleArchive}
        disabled={loading}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '7px 14px',
          borderRadius: '8px',
          border:       '1px solid var(--border)',
          background:   'var(--bg-card)',
          color:        'var(--text-secondary)',
          fontSize:     '13px',
          fontWeight:   500,
          cursor:       'pointer',
          transition:   'all 0.15s ease',
        }}
      >
        📦 Снять с публикации
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '7px 14px',
          borderRadius: '8px',
          border:       '1px solid #fca5a5',
          background:   'transparent',
          color:        '#ef4444',
          fontSize:     '13px',
          fontWeight:   500,
          cursor:       'pointer',
          transition:   'all 0.15s ease',
        }}
      >
        🗑️ Удалить
      </button>
    </div>
  )
}
