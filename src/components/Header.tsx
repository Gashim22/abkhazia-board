'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Логотип */}
        <Link href="/" className="shrink-0 text-xl font-bold text-[#1a6b3c]">
          Абхазия.ру
        </Link>

        {/* Поиск — скрывается на мобильном */}
        <div className="hidden md:flex flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Поиск по объявлениям..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#f4f7f5] border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20
                       transition-colors"
          />
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link
            href="/listings/new"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium
                       text-white bg-[#1a6b3c] hover:bg-[#2d9e5f] rounded-lg transition-colors"
          >
            + Подать объявление
          </Link>

          {/* Мобильная версия кнопки — только иконка «+» */}
          <Link
            href="/listings/new"
            className="sm:hidden flex items-center justify-center w-9 h-9
                       text-white bg-[#1a6b3c] hover:bg-[#2d9e5f] rounded-lg text-lg font-bold transition-colors"
            aria-label="Подать объявление"
          >
            +
          </Link>

          <button
            className="px-4 py-2 text-sm font-medium text-[#1a6b3c] border border-[#1a6b3c]
                       hover:bg-[#1a6b3c] hover:text-white rounded-lg transition-colors"
          >
            Войти
          </button>
        </div>

      </div>

      {/* Поиск на мобильном — отдельная строка под шапкой */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Поиск по объявлениям..."
            className="w-full pl-8 pr-4 py-2 text-sm bg-[#f4f7f5] border border-gray-200 rounded-lg
                       outline-none focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20
                       transition-colors"
          />
        </div>
      </div>
    </header>
  )
}
