'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface City { id: number; name: string; slug: string }

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Новые' },
  { value: 'price_asc',  label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'score',      label: 'По рейтингу' },
]

export default function CategoryFilters({ cities }: { cities: City[] }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const city      = searchParams.get('city')       ?? ''
  const priceFrom = searchParams.get('price_from') ?? ''
  const priceTo   = searchParams.get('price_to')   ?? ''
  const sort      = searchParams.get('sort')       ?? 'newest'
  const hasFilters = city || priceFrom || priceTo || sort !== 'newest'

  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: '16px',
      padding:      '16px 20px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>

        {/* ── Город ── */}
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none',
          }}>📍</span>
          <select
            value={city}
            onChange={e => setParam('city', e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background:   'var(--bg-primary)',
              border:       '1px solid var(--border)',
              borderRadius: '10px',
              padding:      '8px 32px 8px 34px',
              fontSize:     '14px',
              color:        'var(--text-primary)',
              cursor:       'pointer',
              outline:      'none',
              width:        '100%',
            }}
          >
            <option value="">Все города</option>
            {cities.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <span style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '10px',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }}>▾</span>
        </div>

        {/* ── Цена от–до ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PriceInput
            placeholder="от"
            value={priceFrom}
            onChange={v => setParam('price_from', v)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
          <PriceInput
            placeholder="до"
            value={priceTo}
            onChange={v => setParam('price_to', v)}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>₽</span>
        </div>

        {/* ── Разделитель ── */}
        <div style={{ width: '1px', height: '28px', background: 'var(--border)',
                      display: 'none' }} className="sm:block" />

        {/* ── Сортировка — pills ── */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setParam('sort', o.value === 'newest' ? '' : o.value)}
              style={{
                padding:      '6px 14px',
                borderRadius: '20px',
                fontSize:     '13px',
                fontWeight:   sort === o.value ? 600 : 400,
                border:       `1px solid ${sort === o.value ? 'var(--accent)' : 'var(--border)'}`,
                background:   sort === o.value ? 'var(--accent)' : 'transparent',
                color:        sort === o.value ? '#fff' : 'var(--text-secondary)',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* ── Сброс ── */}
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            style={{
              marginLeft:   'auto',
              padding:      '6px 14px',
              borderRadius: '20px',
              fontSize:     '13px',
              border:       '1px solid var(--border)',
              background:   'transparent',
              color:        'var(--text-muted)',
              cursor:       'pointer',
              transition:   'all 0.15s ease',
            }}
          >
            ✕ Сбросить
          </button>
        )}
      </div>
    </div>
  )
}

function PriceInput({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      min={0}
      onChange={e => onChange(e.target.value)}
      style={{
        width:        '80px',
        padding:      '7px 10px',
        borderRadius: '10px',
        border:       '1px solid var(--border)',
        background:   'var(--bg-primary)',
        color:        'var(--text-primary)',
        fontSize:     '14px',
        outline:      'none',
        /* убрать стрелки через inline не получится — добавлено в globals.css */
      }}
      className="no-spin"
    />
  )
}
