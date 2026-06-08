'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Письмо с подтверждением отправлено на ' + email)
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>
        {mode === 'login' ? 'Вход' : 'Регистрация'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 15,
          }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 15,
          }}
        />

        {error && (
          <p style={{ color: '#c0392b', fontSize: 14, margin: 0 }}>
            ❌ {error}
          </p>
        )}
        {success && (
          <p style={{ color: '#1a6b3c', fontSize: 14, margin: 0 }}>
            ✅ {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 12px',
            background: loading ? '#aaa' : '#1a6b3c',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
              style={{ color: '#1a6b3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Зарегистрироваться
            </button>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              style={{ color: '#1a6b3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Войти
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  )
}
