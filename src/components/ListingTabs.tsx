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
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab('description')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                      ${tab === 'description'
                        ? 'border-[#1a6b3c] text-[#1a6b3c]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
        >
          Описание
        </button>
        <button
          onClick={() => setTab('characteristics')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                      ${tab === 'characteristics'
                        ? 'border-[#1a6b3c] text-[#1a6b3c]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
        >
          Характеристики
        </button>
      </div>

      {/* Содержимое */}
      {tab === 'description' && (
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {description?.trim()
            ? description
            : <span className="text-gray-400">Описание не указано</span>
          }
        </div>
      )}

      {tab === 'characteristics' && (
        <div className="divide-y divide-gray-100">
          {characteristics.length === 0 ? (
            <p className="text-sm text-gray-400">Характеристики не указаны</p>
          ) : (
            characteristics.map(({ label, value }) => (
              <div key={label} className="flex py-2 text-sm">
                <span className="w-1/2 text-gray-500">{label}</span>
                <span className="w-1/2 text-gray-900 font-medium">{value}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
