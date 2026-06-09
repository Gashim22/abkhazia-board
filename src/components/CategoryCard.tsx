'use client'

import Link from 'next/link'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  listings_count: number
}

export default function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border)',
          borderRadius: '16px',
          padding:      '20px 16px',
          textAlign:    'center',
          cursor:       'pointer',
          transition:   'transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
          boxShadow:    'var(--shadow)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.transform    = 'translateY(-3px)'
          el.style.borderColor  = 'var(--accent)'
          el.style.background   = 'var(--accent-light)'
          el.style.boxShadow    = 'var(--shadow-hover)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform    = 'translateY(0)'
          el.style.borderColor  = 'var(--border)'
          el.style.background   = 'var(--bg-card)'
          el.style.boxShadow    = 'var(--shadow)'
        }}
      >
        {/* Иконка */}
        <div style={{
          width: '48px', height: '48px',
          background:   'var(--accent-light)',
          borderRadius: '12px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          margin:       '0 auto',
          fontSize:     '24px',
        }}>
          {cat.icon ?? '📦'}
        </div>

        {/* Название */}
        <p style={{
          marginTop:  '12px',
          fontWeight: 600,
          fontSize:   '13px',
          color:      'var(--text-primary)',
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
