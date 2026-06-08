import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Простой серверный клиент без cookies.
// Используется для чтения публичных данных (listings, categories, cities).
// Когда добавим авторизацию — переключимся на createServerClient из @supabase/ssr.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
