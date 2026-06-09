'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Category { id: number; name: string; slug: string; icon: string | null }
interface City     { id: number; name: string; slug: string }

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [cities,     setCities]     = useState<City[]>([])

  const [title,        setTitle]       = useState('')
  const [description,  setDescription] = useState('')
  const [price,        setPrice]       = useState('')
  const [isNegotiable, setIsNegotiable]= useState(false)
  const [categoryId,   setCategoryId]  = useState<number | null>(null)
  const [cityId,       setCityId]      = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Проверяем авторизацию
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [
        { data: listing },
        { data: cats },
        { data: cits },
      ] = await Promise.all([
        supabase.from('listings').select('*').eq('id', id).single(),
        supabase.from('categories').select('id, name, slug, icon').is('parent_id', null).order('sort_order'),
        supabase.from('cities').select('id, name, slug').order('name'),
      ])

      if (!listing || listing.user_id !== user.id) {
        router.push('/')
        return
      }

      setTitle(listing.title ?? '')
      setDescription(listing.description ?? '')
      setPrice(listing.price ? String(listing.price) : '')
      setIsNegotiable(listing.price === null)
      setCategoryId(listing.category_id)
      setCityId(listing.city_id)
      setCategories(cats ?? [])
      setCities(cits ?? [])
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!title.trim())   { setError('Введите заголовок'); return }
    if (!categoryId)     { setError('Выберите категорию'); return }
    if (!cityId)         { setError('Выберите город'); return }

    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('listings')
      .update({
        title:       title.trim(),
        description: description.trim(),
        price:       isNegotiable ? null : Number(price) || null,
        category_id: categoryId,
        city_id:     cityId,
      })
      .eq('id', id)

    if (err) {
      setError(`Ошибка: ${err.message}`)
      setSaving(false)
      return
    }

    router.push(`/listing/${id}`)
    router.refresh()
  }

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
    </div>
  )

  const selectedCat = categories.find(c => c.id === categoryId)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 40px' }}>
      <h1 style={{
        fontFamily: 'var(--font-montserrat), sans-serif',
        fontWeight: 800, fontSize: '24px',
        color:      'var(--text-primary)',
        marginBottom: '6px',
      }}>
        Редактировать объявление
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
        Внесите изменения и нажмите «Сохранить»
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Категория */}
        <FieldBlock label="Категория">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                style={{
                  padding:      '10px 8px',
                  borderRadius: '12px',
                  border:       `2px solid ${categoryId === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                  background:   categoryId === cat.id ? 'var(--accent-light)' : 'var(--bg-card)',
                  cursor:       'pointer',
                  textAlign:    'center',
                  transition:   'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '22px' }}>{cat.icon ?? '📦'}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px',
                              color: 'var(--text-primary)' }}>{cat.name}</div>
              </button>
            ))}
          </div>
          {selectedCat && (
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '8px' }}>
              ✓ {selectedCat.icon} {selectedCat.name}
            </p>
          )}
        </FieldBlock>

        {/* Заголовок */}
        <FieldBlock label="Заголовок *">
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="Заголовок объявления"
          />
        </FieldBlock>

        {/* Описание */}
        <FieldBlock label="Описание">
          <textarea
            value={description}
            maxLength={3000}
            rows={5}
            onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, resize: 'none' }}
            placeholder="Опишите товар или услугу..."
          />
        </FieldBlock>

        {/* Цена */}
        <FieldBlock label="Цена">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number"
                value={price}
                min={0}
                disabled={isNegotiable}
                onChange={e => setPrice(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: '32px',
                  opacity: isNegotiable ? 0.5 : 1,
                }}
                placeholder="0"
                className="no-spin"
              />
              <span style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '14px',
              }}>₽</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '14px', cursor: 'pointer',
                            color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={isNegotiable}
                onChange={e => { setIsNegotiable(e.target.checked); if (e.target.checked) setPrice('') }}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
              Договорная
            </label>
          </div>
        </FieldBlock>

        {/* Город */}
        <FieldBlock label="Город *">
          <select
            value={cityId ?? ''}
            onChange={e => setCityId(e.target.value ? Number(e.target.value) : null)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Выберите город</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FieldBlock>

        {/* Ошибка */}
        {error && (
          <div style={{
            background:   '#fef2f2',
            border:       '1px solid #fca5a5',
            borderRadius: '10px',
            padding:      '12px 16px',
            color:        '#ef4444',
            fontSize:     '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="btn-secondary"
            style={{ flex: '0 0 auto' }}
          >
            ← Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '12px' }}
          >
            {saving ? 'Сохраняем...' : '✓ Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '11px 14px',
  borderRadius: '10px',
  border:       '1px solid var(--border)',
  background:   'var(--bg-card)',
  color:        'var(--text-primary)',
  fontSize:     '14px',
  outline:      'none',
  transition:   'border-color 0.15s ease',
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display:      'block',
        fontSize:     '13px',
        fontWeight:   600,
        color:        'var(--text-secondary)',
        marginBottom: '8px',
        textTransform:'uppercase',
        letterSpacing:'0.04em',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
