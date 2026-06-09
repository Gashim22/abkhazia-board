'use client'

import { useState } from 'react'

interface ListingTabsProps {
  description: string | null
  characteristics: { label: string; value: string }[]
}

export default function ListingTabs({ description, characteristics }: ListingTabsProps) {
  const [tab, setTab] = useState<'description' | 'characteristics'>('description')

  return (
    <div>
      {/* Вкладки */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        <button
          onClick={() => setTab('description')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            borderBottom: tab === 'description' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
            color: tab === 'description' ? 'var(--accent)' : 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          Описание
        </button>
        <button
          onClick={() => setTab('characteristics')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            borderBottom: tab === 'characteristics' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
            color: tab === 'characteristics' ? 'var(--accent)' : 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          Характеристики
        </button>
      </div>

      {/* Содержимое */}
      {tab === 'description' && (
        <div style={{ fontSize: '14px', color: 'var(--text-primary)',
                      lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {description?.trim()
            ? description
            : <span style={{ color: 'var(--text-muted)' }}>Описание не указано</span>
          }
        </div>
      )}

      {tab === 'characteristics' && (
        <div>
          {characteristics.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Характеристики не указаны
            </p>
          ) : (
            characteristics.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', padding: '8px 0', fontSize: '14px',
                                        borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: '50%', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ width: '50%', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
