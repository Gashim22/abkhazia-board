'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, FormEvent, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { User } from '@supabase/supabase-js'

function SearchInput({ className }: { className?: string }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative w-full">
        <Search size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Поиск по объявлениям..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>
    </form>
  )
}

function AuthButtons() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) return (
    <div className="w-20 h-9 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
  )

  if (user) return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:block text-sm max-w-[130px] truncate"
            style={{ color: 'var(--text-secondary)' }}>
        {user.email}
      </span>
      <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
        Выйти
      </button>
    </div>
  )

  return (
    <Link href="/login" className="btn-secondary text-sm py-2 px-4">
      Войти
    </Link>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 transition-all" style={{
      background: 'var(--header-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
    }}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">

        {/* Логотип */}
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--text-primary)' }}>
          Абхазия
          <span style={{ color: 'var(--accent)' }}>.ру</span>
        </Link>

        {/* Поиск — десктоп */}
        <Suspense fallback={<div className="hidden md:flex flex-1" />}>
          <SearchInput className="hidden md:flex flex-1" />
        </Suspense>

        {/* Правая часть */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link href="/create"
                className="hidden sm:inline-flex btn-primary text-sm py-2.5 px-5">
            + Подать объявление
          </Link>
          <Link href="/create"
                className="sm:hidden btn-primary w-9 h-9 p-0 justify-center text-base font-bold"
                aria-label="Подать объявление">
            +
          </Link>
          <AuthButtons />
          <ThemeToggle />
        </div>
      </div>

      {/* Мобильный поиск */}
      <div className="md:hidden px-4 pb-3" style={{ marginTop: '-8px' }}>
        <Suspense fallback={null}>
          <SearchInput />
        </Suspense>
      </div>
    </header>
  )
}
