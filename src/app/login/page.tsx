'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    console.log('=== Кнопка нажата ===', email, password)
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      console.log('Ответ Supabase:', { data, error })

      if (error) {
        console.error('Ошибка входа:', error)
        setError(`Ошибка: ${error.message}`)
      } else {
        console.log('Вход успешен, редирект на /')
        router.push('/')
        router.refresh()
      }
    } catch (e) {
      console.error('Исключение:', e)
      setError(`Исключение: ${String(e)}`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Войти</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: 8 }}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: 8 }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '8px 20px', background: 'green',
                 color: 'white', cursor: 'pointer' }}
      >
        {loading ? 'Входим...' : 'Войти'}
      </button>
    </div>
  )
}
