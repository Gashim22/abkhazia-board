'use client'

import { useEffect, useRef, useState, useCallback, DragEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Category { id: number; name: string; slug: string; icon: string | null }
interface City     { id: number; name: string; slug: string }

interface NewPhoto {
  id:        string
  file:      File
  preview:   string
  url:       string | null   // после загрузки
  uploading: boolean
  error:     string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1px solid var(--border)', background: 'var(--bg-card)',
  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '13px', fontWeight: 600,
        color: 'var(--text-secondary)', marginBottom: '8px',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [userId,        setUserId]        = useState<string | null>(null)
  const [categories,    setCategories]    = useState<Category[]>([])
  const [cities,        setCities]        = useState<City[]>([])

  // Поля формы
  const [title,         setTitle]         = useState('')
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [isNegotiable,  setIsNegotiable]  = useState(false)
  const [categoryId,    setCategoryId]    = useState<number | null>(null)
  const [cityId,        setCityId]        = useState<number | null>(null)

  // Фото
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])   // текущие URL из БД
  const [deletedPhotos,  setDeletedPhotos]  = useState<string[]>([])   // URL которые удалили
  const [newPhotos,      setNewPhotos]      = useState<NewPhoto[]>([])  // новые файлы
  const [dragOver,       setDragOver]       = useState(false)
  const [dragIdx,        setDragIdx]        = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // ── Загрузка данных ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: listing }, { data: cats }, { data: cits }] = await Promise.all([
        supabase.from('listings').select('*').eq('id', id).single(),
        supabase.from('categories').select('id, name, slug, icon').is('parent_id', null).order('sort_order'),
        supabase.from('cities').select('id, name, slug').order('name'),
      ])

      if (!listing || listing.user_id !== user.id) { router.push('/'); return }

      setTitle(listing.title ?? '')
      setDescription(listing.description ?? '')
      setPrice(listing.price ? String(listing.price) : '')
      setIsNegotiable(listing.price === null)
      setCategoryId(listing.category_id)
      setCityId(listing.city_id)
      setExistingPhotos(listing.photos ?? [])
      setCategories(cats ?? [])
      setCities(cits ?? [])
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Загрузка нового фото ─────────────────────────────────────
  const uploadFiles = useCallback(async (files: File[]) => {
    const items: NewPhoto[] = files.slice(0, 10 - existingPhotos.length - newPhotos.length)
      .map(file => ({
        id: crypto.randomUUID(), file,
        preview: URL.createObjectURL(file),
        url: null, uploading: true, error: null,
      }))

    setNewPhotos(p => [...p, ...items])

    for (const item of items) {
      const ext  = item.file.name.split('.').pop()
      const path = `${userId ?? 'anon'}/${item.id}.${ext}`

      const { error: err } = await supabase.storage
        .from('listings').upload(path, item.file, { upsert: true })

      if (err) {
        setNewPhotos(p => p.map(x => x.id === item.id
          ? { ...x, uploading: false, error: err.message } : x))
      } else {
        const { data } = supabase.storage.from('listings').getPublicUrl(path)
        setNewPhotos(p => p.map(x => x.id === item.id
          ? { ...x, uploading: false, url: data.publicUrl } : x))
      }
    }
  }, [existingPhotos.length, newPhotos.length, userId, supabase])

  // ── Удалить существующее фото ────────────────────────────────
  function removeExisting(url: string) {
    setExistingPhotos(p => p.filter(u => u !== url))
    setDeletedPhotos(p => [...p, url])
  }

  // ── Удалить новое (не загруженное) ───────────────────────────
  function removeNew(photo: NewPhoto) {
    URL.revokeObjectURL(photo.preview)
    setNewPhotos(p => p.filter(x => x.id !== photo.id))
  }

  // ── Drag-sort существующих фото ──────────────────────────────
  function onDragStart(idx: number) { setDragIdx(idx) }
  function onDragOver(e: DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setExistingPhotos(p => {
      const arr = [...p]
      const [el] = arr.splice(dragIdx, 1)
      arr.splice(idx, 0, el)
      setDragIdx(idx)
      return arr
    })
  }

  // ── Сохранение ───────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { setError('Введите заголовок'); return }
    if (!categoryId)   { setError('Выберите категорию'); return }
    if (!cityId)       { setError('Выберите город'); return }

    setSaving(true)
    setError(null)

    // 1. Удалить из Storage помеченные фото
    for (const url of deletedPhotos) {
      const filePath = url.split('/listings/')[1]
      if (filePath) {
        await supabase.storage.from('listings').remove([filePath])
      }
    }

    // 2. Собрать итоговый массив фото
    const uploadedNew = newPhotos.filter(p => p.url).map(p => p.url!)
    const finalPhotos = [...existingPhotos, ...uploadedNew]

    // 3. Сохранить в БД
    const { error: err } = await supabase
      .from('listings')
      .update({
        title:       title.trim(),
        description: description.trim(),
        price:       isNegotiable ? null : Number(price) || null,
        category_id: categoryId,
        city_id:     cityId,
        photos:      finalPhotos,
      })
      .eq('id', id)

    if (err) { setError(`Ошибка: ${err.message}`); setSaving(false); return }

    router.push(`/listing/${id}`)
    router.refresh()
  }

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '60px auto', textAlign: 'center',
                  color: 'var(--text-muted)' }}>Загрузка...</div>
  )

  const selectedCat  = categories.find(c => c.id === categoryId)
  const totalPhotos  = existingPhotos.length + newPhotos.length

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 40px' }}>
      <h1 style={{
        fontFamily: 'var(--font-montserrat), sans-serif',
        fontWeight: 800, fontSize: '24px',
        color: 'var(--text-primary)', marginBottom: '6px',
      }}>
        Редактировать объявление
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
        Внесите изменения и нажмите «Сохранить»
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Категория ── */}
        <FieldBlock label="Категория">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                style={{
                  padding: '10px 8px', borderRadius: '12px', textAlign: 'center',
                  border:     `2px solid ${categoryId === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: categoryId === cat.id ? 'var(--accent-light)' : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
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

        {/* ── Заголовок ── */}
        <FieldBlock label="Заголовок *">
          <input type="text" value={title} maxLength={100}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle} placeholder="Заголовок объявления" />
        </FieldBlock>

        {/* ── Описание ── */}
        <FieldBlock label="Описание">
          <textarea value={description} maxLength={3000} rows={5}
            onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, resize: 'none' }}
            placeholder="Опишите товар или услугу..." />
        </FieldBlock>

        {/* ── Цена ── */}
        <FieldBlock label="Цена">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input type="number" value={price} min={0} disabled={isNegotiable}
                onChange={e => setPrice(e.target.value)}
                style={{ ...inputStyle, paddingRight: '32px', opacity: isNegotiable ? 0.5 : 1 }}
                placeholder="0" className="no-spin" />
              <span style={{ position: 'absolute', right: '12px', top: '50%',
                             transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>
                ₽
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '14px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={isNegotiable}
                onChange={e => { setIsNegotiable(e.target.checked); if (e.target.checked) setPrice('') }}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
              Договорная
            </label>
          </div>
        </FieldBlock>

        {/* ── Город ── */}
        <FieldBlock label="Город *">
          <select value={cityId ?? ''} style={{ ...inputStyle, cursor: 'pointer' }}
            onChange={e => setCityId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Выберите город</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FieldBlock>

        {/* ── Фото ── */}
        <FieldBlock label={`Фото (${totalPhotos}/10)`}>

          {/* Зона загрузки */}
          {totalPhotos < 10 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(Array.from(e.dataTransfer.files)) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border:       `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding:      '24px',
                textAlign:    'center',
                cursor:       'pointer',
                background:   dragOver ? 'var(--accent-light)' : 'var(--bg-primary)',
                marginBottom: totalPhotos > 0 ? '12px' : 0,
                transition:   'all 0.15s ease',
              }}
            >
              <p style={{ fontSize: '28px', marginBottom: '6px' }}>📷</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Перетащите или <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>выберите фото</span>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                JPG, PNG, WebP · до 5 МБ
              </p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple className="hidden"
                onChange={e => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
            </div>
          )}

          {/* Сетка фото */}
          {(existingPhotos.length > 0 || newPhotos.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>

              {/* Существующие фото */}
              {existingPhotos.map((url, idx) => (
                <div key={url} draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDragEnd={() => setDragIdx(null)}
                  style={{
                    position:     'relative',
                    aspectRatio:  '1',
                    borderRadius: '10px',
                    overflow:     'hidden',
                    border:       '2px solid var(--border)',
                    cursor:       'grab',
                    opacity:      dragIdx === idx ? 0.5 : 1,
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {idx === 0 && (
                    <span style={{
                      position: 'absolute', top: '6px', left: '6px',
                      background: 'var(--accent)', color: '#fff',
                      fontSize: '10px', fontWeight: 700,
                      padding: '2px 6px', borderRadius: '4px',
                    }}>Обложка</span>
                  )}
                  <button type="button" onClick={() => removeExisting(url)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '24px', height: '24px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>
              ))}

              {/* Новые фото */}
              {newPhotos.map(photo => (
                <div key={photo.id} style={{
                  position: 'relative', aspectRatio: '1',
                  borderRadius: '10px', overflow: 'hidden',
                  border: `2px solid ${photo.error ? '#ef4444' : 'var(--border)'}`,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {photo.uploading && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '12px',
                    }}>Загрузка...</div>
                  )}
                  {photo.error && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(239,68,68,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '11px', textAlign: 'center', padding: '4px',
                    }}>{photo.error}</div>
                  )}
                  <button type="button" onClick={() => removeNew(photo)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '24px', height: '24px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>
              ))}
            </div>
          )}

          {totalPhotos === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Фотографии не добавлены
            </p>
          )}
        </FieldBlock>

        {/* ── Ошибка ── */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '10px', padding: '12px 16px',
            color: '#ef4444', fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Кнопки ── */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button type="button" onClick={() => router.back()}
            disabled={saving} className="btn-secondary" style={{ flex: '0 0 auto' }}>
            ← Отмена
          </button>
          <button type="button" onClick={handleSave}
            disabled={saving || newPhotos.some(p => p.uploading)}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '12px' }}>
            {saving ? 'Сохраняем...' : '✓ Сохранить изменения'}
          </button>
        </div>

      </div>
    </div>
  )
}
