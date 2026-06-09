'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ждём монтирования чтобы избежать гидратации
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className="w-9 h-9 flex items-center justify-center rounded-lg
                 bg-gray-100 hover:bg-gray-200
                 dark:bg-gray-800 dark:hover:bg-gray-700
                 transition-colors text-lg"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
