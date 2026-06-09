'use client'

import { useEffect, useState, useCallback, useRef, DragEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Типы ────────────────────────────────────────────────────
interface Category { id: number; name: string; slug: string; icon: string | null }
interface City     { id: number; name: string; slug: string }

interface PhotoItem {
  id:         string
  file:       File
  previewUrl: string
  storageUrl: string | null
  progress:   number   // 0–100
  uploading:  boolean
  error:      string | null
}

interface FormData {
  category_id:   number | null
  title:         string
  description:   string
  price:         string
  is_negotiable: boolean
  city_id:       number | null
  photos:        PhotoItem[]
}

const MAX_PHOTOS   = 10
const MAX_MB       = 5
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

// ─── Индикатор шагов ─────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Категория и описание', 'Фотографии', 'Контакты']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                            ${n < current ? 'bg-[#2d9e5f] text-white'
                            : n === current ? 'bg-[#1a6b3c] text-white'
                            : 'bg-gray-200 text-gray-500'}`}>
              {n < current ? '✓' : n}
            </div>
            <span className={`text-sm hidden sm:block
                              ${n === current ? 'text-[#1a6b3c] font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${n < current ? 'bg-[#2d9e5f]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const left = max - value.length
  return (
    <span className={`text-xs ${left < 20 ? 'text-red-400' : 'text-gray-400'}`}>
      {value.length} / {max}
    </span>
  )
}

// ─── ШАГ 1 ───────────────────────────────────────────────────
function Step1({
  form, setForm, categories, cities, onNext,
}: {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  categories: Category[]
  cities: City[]
  onNext: () => void
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.category_id)                    e.category_id  = 'Выберите категорию'
    if (!form.title.trim())                   e.title        = 'Введите заголовок'
    if (!form.description.trim())             e.description  = 'Введите описание'
    if (!form.is_negotiable && !form.price)   e.price        = 'Укажите цену или выберите «Договорная»'
    if (!form.city_id)                        e.city_id      = 'Выберите город'
    setErrors(e)
    return !Object.keys(e).length
  }

  const placeholders: Record<string, string> = {
    'avto':         'Например: Toyota Camry 2020, отличное состояние',
    'nedvizhimost': 'Например: 2-комнатная квартира в центре Сухума',
    'rabota':       'Например: Требуется повар в ресторан, опыт от 2 лет',
    'uslugi':       'Например: Ремонт квартир под ключ, выезд по всей Абхазии',
    'elektronika':  'Например: iPhone 15 Pro 256GB, как новый',
    'odezhda':      'Например: Куртка зимняя мужская, размер L',
    'zhivotnye':    'Например: Щенки немецкой овчарки, 2 месяца',
    'mebel':        'Например: Диван угловой, состояние хорошее',
    'stroy':        'Например: Цемент М500, 50 мешков',
    'raznoe':       'Например: Продам велосипед горный',
  }

  const selected = categories.find(c => c.id === form.category_id)

  return (
    <div className="space-y-6">
      {/* Категории */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Категория <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map(cat => (
            <button key={cat.id} type="button"
              onClick={() => set('category_id', cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all
                          ${form.category_id === cat.id
                            ? 'border-[#1a6b3c] bg-[#f4f7f5] shadow-sm'
                            : 'border-gray-100 hover:border-[#2d9e5f] hover:bg-gray-50'}`}>
              <span className="text-2xl">{cat.icon ?? '📦'}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
        {errors.category_id && <p className="text-xs text-red-400 mt-2">{errors.category_id}</p>}
      </div>

      {selected && (
        <div className="space-y-5 pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500 pt-1">
            Категория: <span className="font-medium text-[#1a6b3c]">{selected.icon} {selected.name}</span>
          </p>

          {/* Заголовок */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Заголовок <span className="text-red-400">*</span></label>
              <CharCounter value={form.title} max={100} />
            </div>
            <input type="text" value={form.title} maxLength={100}
              placeholder={placeholders[selected?.slug ?? ''] ?? 'Введите заголовок'}
              onChange={e => set('title', e.target.value)}
              className={`w-full px-4 py-3 text-sm border rounded-xl outline-none transition-colors
                          ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'}`} />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Описание */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Описание <span className="text-red-400">*</span></label>
              <CharCounter value={form.description} max={3000} />
            </div>
            <textarea value={form.description} maxLength={3000} rows={5}
              placeholder="Опишите товар: состояние, комплектация, причина продажи..."
              onChange={e => set('description', e.target.value)}
              className={`w-full px-4 py-3 text-sm border rounded-xl outline-none resize-none transition-colors
                          ${errors.description ? 'border-red-300' : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'}`} />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цена <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input type="number" value={form.price} min={0} placeholder="0"
                  disabled={form.is_negotiable}
                  onChange={e => set('price', e.target.value)}
                  className={`w-full px-4 py-3 pr-8 text-sm border rounded-xl outline-none transition-colors
                              disabled:bg-gray-50 disabled:text-gray-400
                              ${errors.price ? 'border-red-300' : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'}`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₽</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input type="checkbox" checked={form.is_negotiable}
                  className="w-4 h-4 accent-[#1a6b3c]"
                  onChange={e => { set('is_negotiable', e.target.checked); if (e.target.checked) set('price', '') }} />
                <span className="text-sm text-gray-700">Договорная</span>
              </label>
            </div>
            {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
          </div>

          {/* Город */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город <span className="text-red-400">*</span>
            </label>
            <select value={form.city_id ?? ''}
              onChange={e => set('city_id', e.target.value ? Number(e.target.value) : null)}
              className={`w-full px-4 py-3 text-sm border rounded-xl outline-none bg-white transition-colors
                          ${errors.city_id ? 'border-red-300' : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'}`}>
              <option value="">Выберите город</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.city_id && <p className="text-xs text-red-400 mt-1">{errors.city_id}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button type="button" onClick={() => validate() && onNext()}
          className="px-8 py-3 bg-[#1a6b3c] text-white font-medium rounded-xl
                     hover:bg-[#2d9e5f] active:scale-95 transition-all">
          Далее →
        </button>
      </div>
    </div>
  )
}

// ─── ШАГ 2 ───────────────────────────────────────────────────
function Step2({
  photos, setPhotos, userId, onBack, onNext,
}: {
  photos:    PhotoItem[]
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>
  userId:    string | null
  onBack:    () => void
  onNext:    () => void
}) {
  const [draggingOver, setDraggingOver] = useState(false)
  const [dragIdx,      setDragIdx]      = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Валидация файла
  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) return 'Только JPG, PNG или WebP'
    if (file.size > MAX_MB * 1024 * 1024)  return `Максимум ${MAX_MB} МБ`
    return null
  }

  // Загрузка файлов
  const uploadFiles = useCallback(async (files: File[]) => {
    const supabase = createClient()
    const available = MAX_PHOTOS - photos.length
    const toUpload  = files.slice(0, available)

    const newItems: PhotoItem[] = toUpload.map(file => ({
      id:         crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      storageUrl: null,
      progress:   0,
      uploading:  true,
      error:      validateFile(file),
    }))

    setPhotos(p => [...p, ...newItems])

    // Загружаем каждый файл
    for (const item of newItems) {
      if (item.error) {
        setPhotos(p => p.map(x => x.id === item.id ? { ...x, uploading: false } : x))
        continue
      }

      // Плавная анимация прогресса
      const interval = setInterval(() => {
        setPhotos(p => p.map(x =>
          x.id === item.id && x.progress < 85
            ? { ...x, progress: x.progress + 10 }
            : x
        ))
      }, 150)

      const ext  = item.file.name.split('.').pop()
      const path = `${userId ?? 'anon'}/${item.id}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('listings')
        .upload(path, item.file, { upsert: true })

      clearInterval(interval)

      if (storageError) {
        setPhotos(p => p.map(x =>
          x.id === item.id
            ? { ...x, uploading: false, progress: 0, error: `Ошибка: ${storageError.message}` }
            : x
        ))
      } else {
        const { data } = supabase.storage.from('listings').getPublicUrl(path)
        setPhotos(p => p.map(x =>
          x.id === item.id
            ? { ...x, uploading: false, progress: 100, storageUrl: data.publicUrl }
            : x
        ))
      }
    }
  }, [photos.length, userId, setPhotos])

  // Drag & drop в зону загрузки
  function handleDropZone(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDraggingOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }

  // Drag & drop для сортировки
  function handleDragStart(idx: number) { setDragIdx(idx) }

  function handleDragOverItem(e: DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setPhotos(p => {
      const arr  = [...p]
      const [el] = arr.splice(dragIdx, 1)
      arr.splice(idx, 0, el)
      setDragIdx(idx)
      return arr
    })
  }

  function handleDragEnd() { setDragIdx(null) }

  function remove(id: string) {
    setPhotos(p => {
      const item = p.find(x => x.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return p.filter(x => x.id !== id)
    })
  }

  const isUploading = photos.some(p => p.uploading)

  return (
    <div className="space-y-6">
      {/* Зона загрузки */}
      {photos.length < MAX_PHOTOS && (
        <div
          onDragOver={e => { e.preventDefault(); setDraggingOver(true) }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDropZone}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                      transition-colors select-none
                      ${draggingOver
                        ? 'border-[#1a6b3c] bg-[#f4f7f5]'
                        : 'border-gray-200 hover:border-[#2d9e5f] hover:bg-gray-50'}`}
        >
          <p className="text-4xl mb-3">📷</p>
          <p className="text-sm font-medium text-gray-700">
            Перетащите фото или <span className="text-[#1a6b3c] underline">выберите файл</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP · до {MAX_MB} МБ · максимум {MAX_PHOTOS} фото
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Загружено: {photos.length} / {MAX_PHOTOS}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) uploadFiles(files)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* Сетка фотографий */}
      {photos.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Перетащите фото чтобы изменить порядок. Первое фото — обложка.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOverItem(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-grab
                            transition-all select-none
                            ${dragIdx === idx ? 'opacity-50 scale-95' : 'opacity-100'}
                            ${photo.error ? 'border-red-300' : 'border-gray-200'}`}
              >
                {/* Превью */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Фото ${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Бейдж «Обложка» */}
                {idx === 0 && !photo.error && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#1a6b3c] text-white
                                   text-xs font-bold rounded-md">
                    Обложка
                  </span>
                )}

                {/* Прогресс-бар */}
                {photo.uploading && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1.5">
                    <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-200"
                        style={{ width: `${photo.progress}%` }}
                      />
                    </div>
                    <p className="text-white text-xs text-center mt-0.5">{photo.progress}%</p>
                  </div>
                )}

                {/* Ошибка */}
                {photo.error && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center">{photo.error}</p>
                  </div>
                )}

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500
                             text-white rounded-full flex items-center justify-center text-sm
                             transition-colors"
                  aria-label="Удалить фото"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Подсказка если ни одно фото не загружено */}
      {photos.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          Фотографии необязательны, но с ними объявление привлекает больше внимания
        </p>
      )}

      {/* Кнопки */}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack}
          className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl
                     hover:border-gray-400 transition-colors">
          ← Назад
        </button>
        <button type="button" onClick={onNext}
          disabled={isUploading}
          className="px-8 py-3 bg-[#1a6b3c] text-white font-medium rounded-xl
                     hover:bg-[#2d9e5f] active:scale-95 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed">
          {isUploading ? 'Загружается...' : 'Далее →'}
        </button>
      </div>
    </div>
  )
}

// ─── ШАГ 3: Предпросмотр и публикация ───────────────────────
function Step3({
  form, categories, cities, userId,
  onBack, onPublished,
}: {
  form:       FormData
  categories: Category[]
  cities:     City[]
  userId:     string | null
  onBack:     () => void
  onPublished:(id: string) => void
}) {
  const [publishing, setPublishing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const category = categories.find(c => c.id === form.category_id)
  const city     = cities.find(c => c.id === form.city_id)
  const photos   = form.photos.filter(p => p.storageUrl)

  function formatPrice() {
    if (form.is_negotiable) return 'Договорная'
    if (!form.price)        return 'Не указана'
    return Number(form.price).toLocaleString('ru-RU') + ' ₽'
  }

  const summary = [
    { label: 'Категория', value: category ? `${category.icon ?? ''} ${category.name}` : '—' },
    { label: 'Город',     value: city?.name ?? '—' },
    { label: 'Цена',      value: formatPrice() },
    { label: 'Фотографий',value: String(photos.length) },
    { label: 'Символов в описании', value: String(form.description.length) },
  ]

  async function handlePublish() {
    if (!userId) {
      setError('Шаг 1 ❌ — пользователь не авторизован (userId пустой). Выйди и войди снова.')
      return
    }

    setPublishing(true)
    setError(null)

    const payload = {
      user_id:     userId,
      category_id: form.category_id,
      city_id:     form.city_id,
      title:       form.title.trim(),
      description: form.description.trim(),
      price:       form.is_negotiable ? null : Number(form.price) || null,
      photos:      photos.map(p => p.storageUrl!),
      status:      'active',
    }

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('listings')
      .insert(payload)
      .select('id')
      .single()

    if (err || !data) {
      setError(`Ошибка Supabase: ${err?.message ?? 'нет данных'} | code: ${err?.code ?? '—'} | hint: ${err?.hint ?? '—'}`)
      setPublishing(false)
      return
    }

    onPublished(data.id)
  }

  return (
    <div className="space-y-6">

      {/* Превью объявления */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Фото обложки */}
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0].storageUrl!} alt="Обложка"
               className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300 text-5xl">
            📷
          </div>
        )}

        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{form.title}</h2>
          <p className="text-2xl font-bold text-[#1a6b3c] mb-3">{formatPrice()}</p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            {city     && <span>📍 {city.name}</span>}
            {category && <span>🏷 {category.name}</span>}
            <span>📅 Только что</span>
          </div>

          {form.description && (
            <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
              {form.description}
            </p>
          )}

          {/* Мини-галерея */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {photos.slice(1).map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.storageUrl!} alt=""
                     className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-100" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Чек-лист заполненных данных */}
      <div className="bg-[#f4f7f5] rounded-xl border border-green-100 p-5">
        <h3 className="text-sm font-semibold text-[#1a6b3c] mb-4 flex items-center gap-2">
          ✅ Ваше объявление готово к публикации
        </h3>
        <div className="divide-y divide-green-100">
          {summary.map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ошибка публикации */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
          ⚠️ {error}
        </div>
      )}

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={onBack}
          disabled={publishing}
          className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl
                     hover:border-gray-400 transition-colors disabled:opacity-50">
          ← Редактировать
        </button>
        <button type="button" onClick={handlePublish}
          disabled={publishing}
          className="flex-1 py-4 bg-[#1a6b3c] text-white font-bold text-lg rounded-xl
                     hover:bg-[#2d9e5f] active:scale-95 transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed">
          {publishing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Публикуем...
            </span>
          ) : '🚀 Опубликовать объявление'}
        </button>
      </div>
    </div>
  )
}

// ─── Экран успеха ─────────────────────────────────────────────
function SuccessScreen({
  listingId, onReset,
}: {
  listingId: string
  onReset:   () => void
}) {
  return (
    <div className="text-center py-10">
      <div className="text-7xl mb-6">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Объявление опубликовано!
      </h2>
      <p className="text-gray-500 mb-8">
        Ваше объявление уже доступно всем пользователям сайта
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={`/listing/${listingId}`}
          className="px-8 py-3 bg-[#1a6b3c] text-white font-medium rounded-xl
                     hover:bg-[#2d9e5f] transition-colors"
        >
          Смотреть объявление →
        </a>
        <button
          type="button"
          onClick={onReset}
          className="px-8 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl
                     hover:border-gray-400 transition-colors"
        >
          Подать ещё одно
        </button>
      </div>
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────
const EMPTY_FORM: FormData = {
  category_id:   null,
  title:         '',
  description:   '',
  price:         '',
  is_negotiable: false,
  city_id:       null,
  photos:        [],
}

export default function CreatePage() {
  const [step,        setStep]        = useState(1)
  const [categories,  setCategories]  = useState<Category[]>([])
  const [cities,      setCities]      = useState<City[]>([])
  const [loading,     setLoading]     = useState(true)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [form,        setForm]        = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('id, name, slug, icon').is('parent_id', null).order('sort_order'),
      supabase.from('cities').select('id, name, slug').order('name'),
      supabase.auth.getUser(),
    ]).then(([{ data: cats }, { data: cits }, { data: { user } }]) => {
      setCategories(cats ?? [])
      setCities(cits ?? [])
      setUserId(user?.id ?? null)
      setLoading(false)
    })
  }, [])

  function reset() {
    setForm(EMPTY_FORM)
    setPublishedId(null)
    setStep(1)
  }

  // Экран успеха
  if (publishedId) {
    return (
      <div className="max-w-2xl mx-auto">
        <SuccessScreen listingId={publishedId} onReset={reset} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 style={{
        color: 'var(--text-primary)',
        background: 'transparent',
        fontWeight: 800,
        fontSize: '32px',
        marginBottom: '8px',
      }}>Подать объявление</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Заполните форму — это займёт 2 минуты
      </p>

      <StepIndicator current={step} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {step === 1 && (
            <Step1
              form={form} setForm={setForm}
              categories={categories} cities={cities}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              photos={form.photos}
              setPhotos={photos => setForm(p => ({
                ...p,
                photos: typeof photos === 'function' ? photos(p.photos) : photos,
              }))}
              userId={userId}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              form={form}
              categories={categories}
              cities={cities}
              userId={userId}
              onBack={() => setStep(2)}
              onPublished={setPublishedId}
            />
          )}
        </>
      )}
    </div>
  )
}
