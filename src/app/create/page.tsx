'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Типы ────────────────────────────────────────────────────
interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface City {
  id: number
  name: string
  slug: string
}

interface FormData {
  category_id: number | null
  title: string
  description: string
  price: string
  is_negotiable: boolean
  city_id: number | null
}

// ─── Вспомогательный компонент: счётчик символов ─────────────
function CharCounter({ value, max }: { value: string; max: number }) {
  const left = max - value.length
  return (
    <span className={`text-xs ${left < 20 ? 'text-red-400' : 'text-gray-400'}`}>
      {value.length} / {max}
    </span>
  )
}

// ─── Индикатор шагов ─────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Категория и описание', 'Фотографии', 'Контакты']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1
        const isDone    = step < current
        const isActive  = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                            transition-colors
                            ${isDone   ? 'bg-[#2d9e5f] text-white'
                            : isActive ? 'bg-[#1a6b3c] text-white'
                            :            'bg-gray-200 text-gray-500'}`}>
              {isDone ? '✓' : step}
            </div>
            <span className={`text-sm hidden sm:block
                              ${isActive ? 'text-[#1a6b3c] font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isDone ? 'bg-[#2d9e5f]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────
export default function CreatePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [cities,     setCities]     = useState<City[]>([])
  const [loading,    setLoading]    = useState(true)

  const [form, setForm] = useState<FormData>({
    category_id:    null,
    title:          '',
    description:    '',
    price:          '',
    is_negotiable:  false,
    city_id:        null,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Загружаем категории и города
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('id, name, slug, icon').is('parent_id', null).order('sort_order'),
      supabase.from('cities').select('id, name, slug').order('name'),
    ]).then(([{ data: cats }, { data: cits }]) => {
      setCategories(cats ?? [])
      setCities(cits ?? [])
      setLoading(false)
    })
  }, [])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Валидация перед шагом 2
  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.category_id)             e.category_id  = 'Выберите категорию'
    if (!form.title.trim())            e.title        = 'Введите заголовок'
    if (!form.description.trim())      e.description  = 'Введите описание'
    if (!form.is_negotiable && !form.price) e.price   = 'Укажите цену или выберите «Договорная»'
    if (!form.city_id)                 e.city_id      = 'Выберите город'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) {
      // TODO: шаг 2 — загрузка фотографий
      alert('Шаг 1 заполнен! Шаг 2 будет добавлен в следующем обновлении.')
    }
  }

  const selectedCategory = categories.find((c) => c.id === form.category_id)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Подать объявление</h1>
      <p className="text-sm text-gray-400 mb-6">Заполните форму — это займёт 2 минуты</p>

      <StepIndicator current={1} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Выбор категории ─────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Категория <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setField('category_id', cat.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center
                              transition-all
                              ${form.category_id === cat.id
                                ? 'border-[#1a6b3c] bg-[#f4f7f5] shadow-sm'
                                : 'border-gray-100 hover:border-[#2d9e5f] hover:bg-gray-50'
                              }`}
                >
                  <span className="text-2xl">{cat.icon ?? '📦'}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
            {errors.category_id && (
              <p className="text-xs text-red-400 mt-2">{errors.category_id}</p>
            )}
          </div>

          {/* ── Поля появляются после выбора категории ──────── */}
          {selectedCategory && (
            <div className="space-y-5 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500 pt-1">
                Категория: <span className="font-medium text-[#1a6b3c]">
                  {selectedCategory.icon} {selectedCategory.name}
                </span>
              </p>

              {/* Заголовок */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Заголовок <span className="text-red-400">*</span>
                  </label>
                  <CharCounter value={form.title} max={100} />
                </div>
                <input
                  type="text"
                  value={form.title}
                  maxLength={100}
                  placeholder="Например: iPhone 15 Pro, 256GB, чёрный"
                  onChange={(e) => setField('title', e.target.value)}
                  className={`w-full px-4 py-3 text-sm border rounded-xl outline-none
                              transition-colors
                              ${errors.title
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'
                              }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-400 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Описание */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Описание <span className="text-red-400">*</span>
                  </label>
                  <CharCounter value={form.description} max={3000} />
                </div>
                <textarea
                  value={form.description}
                  maxLength={3000}
                  rows={5}
                  placeholder="Опишите товар: состояние, комплектация, причина продажи..."
                  onChange={(e) => setField('description', e.target.value)}
                  className={`w-full px-4 py-3 text-sm border rounded-xl outline-none resize-none
                              transition-colors
                              ${errors.description
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'
                              }`}
                />
                {errors.description && (
                  <p className="text-xs text-red-400 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Цена */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={form.price}
                      min={0}
                      disabled={form.is_negotiable}
                      placeholder="0"
                      onChange={(e) => setField('price', e.target.value)}
                      className={`w-full px-4 py-3 pr-8 text-sm border rounded-xl outline-none
                                  transition-colors disabled:bg-gray-50 disabled:text-gray-400
                                  ${errors.price
                                    ? 'border-red-300'
                                    : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'
                                  }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      ₽
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={form.is_negotiable}
                      onChange={(e) => {
                        setField('is_negotiable', e.target.checked)
                        if (e.target.checked) setField('price', '')
                      }}
                      className="w-4 h-4 accent-[#1a6b3c]"
                    />
                    <span className="text-sm text-gray-700">Договорная</span>
                  </label>
                </div>
                {errors.price && (
                  <p className="text-xs text-red-400 mt-1">{errors.price}</p>
                )}
              </div>

              {/* Город */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Город <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.city_id ?? ''}
                  onChange={(e) => setField('city_id', e.target.value ? Number(e.target.value) : null)}
                  className={`w-full px-4 py-3 text-sm border rounded-xl outline-none bg-white
                              transition-colors
                              ${errors.city_id
                                ? 'border-red-300'
                                : 'border-gray-200 focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20'
                              }`}
                >
                  <option value="">Выберите город</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                {errors.city_id && (
                  <p className="text-xs text-red-400 mt-1">{errors.city_id}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Кнопка «Далее» ──────────────────────────────── */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3 bg-[#1a6b3c] text-white font-medium rounded-xl
                         hover:bg-[#2d9e5f] active:scale-95 transition-all"
            >
              Далее →
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
