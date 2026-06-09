'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const REASONS = [
  'Мошенничество',
  'Товар запрещён',
  'Дубликат объявления',
  'Неверная категория',
  'Другое',
]

interface Props {
  listingId: string
  onClose: () => void
}

export default function ReportModal({ listingId, onClose }: Props) {
  const [userId, setUserId]     = useState<string | null>(null)
  const [reason, setReason]     = useState('')
  const [comment, setComment]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const supabase = createClient()

  // Получаем текущего пользователя
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Закрывать по Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit() {
    if (!reason) { setError('Выберите причину'); return }
    setLoading(true)
    setError(null)

    const fullReason = reason === 'Другое' && comment.trim()
      ? `Другое: ${comment.trim()}`
      : reason

    const { error: err } = await supabase
      .from('listing_reports')
      .insert({ listing_id: listingId, user_id: userId, reason: fullReason })

    if (err) {
      // Уникальность: уже жаловался
      if (err.code === '23505') {
        setError('Вы уже отправляли жалобу на это объявление')
      } else {
        setError(`Ошибка: ${err.message}`)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    // Автозакрытие через 2 секунды
    setTimeout(onClose, 2000)
  }

  return (
    // Оверлей
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1a2b1f] rounded-2xl shadow-2xl
                      border border-gray-100 dark:border-gray-700 overflow-hidden">

        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-[#e8f5ee]">
            Пожаловаться
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       text-gray-400 hover:text-gray-700 hover:bg-gray-100
                       dark:hover:bg-gray-700 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Контент */}
        <div className="px-6 py-5">

          {/* Экран успеха */}
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-[#e8f5ee]">
                Жалоба отправлена, спасибо!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Мы рассмотрим её в ближайшее время
              </p>
            </div>

          // Не авторизован
          ) : !userId ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-base font-medium text-gray-700 dark:text-[#e8f5ee] mb-4">
                Войдите, чтобы пожаловаться
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-2 bg-[#1a6b3c] text-white text-sm
                           font-medium rounded-xl hover:bg-[#2d9e5f] transition-colors"
              >
                Войти
              </a>
            </div>

          // Форма
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Укажите причину — мы рассмотрим жалобу в течение 24 часов
              </p>

              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                              ${reason === r
                                ? 'border-[#1a6b3c] bg-[#f4f7f5] dark:bg-[#0f1a14]'
                                : 'border-gray-100 dark:border-gray-700 hover:border-[#2d9e5f]'}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-[#1a6b3c] w-4 h-4 shrink-0"
                  />
                  <span className="text-sm text-gray-800 dark:text-[#e8f5ee]">{r}</span>
                </label>
              ))}

              {/* Поле комментария для «Другое» */}
              {reason === 'Другое' && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Опишите проблему подробнее..."
                  rows={3}
                  maxLength={500}
                  className="w-full mt-2 px-4 py-3 text-sm border border-gray-200
                             dark:border-gray-600 dark:bg-[#0f1a14] dark:text-[#e8f5ee]
                             rounded-xl outline-none resize-none
                             focus:border-[#2d9e5f] focus:ring-2 focus:ring-[#2d9e5f]/20"
                />
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
                  ⚠️ {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Кнопки (только если форма активна) */}
        {!done && userId && (
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-600
                         text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl
                         hover:border-gray-400 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm
                         font-medium rounded-xl transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Отправляем...' : 'Отправить жалобу'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
