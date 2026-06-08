import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 1. Проверяем наличие переменных
  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      step: 'env_vars',
      error: `Missing: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`,
      url_present:  !!url,
      key_present:  !!key,
      key_preview:  key ? key.slice(0, 20) + '...' : null,
    })
  }

  // 2. Пробуем подключиться к Supabase
  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .limit(3)

    if (error) {
      return NextResponse.json({
        ok: false,
        step: 'supabase_query',
        error: error.message,
        url_preview: url.slice(0, 40),
      })
    }

    return NextResponse.json({
      ok: true,
      step: 'all_good',
      cities: data,
      url_preview: url.slice(0, 40),
    })
  } catch (e: unknown) {
    return NextResponse.json({
      ok: false,
      step: 'exception',
      error: e instanceof Error ? e.message : String(e),
      // Показываем что именно сохранено в переменных
      url_raw:     JSON.stringify(url),
      url_length:  url.length,
      key_length:  key.length,
      key_preview: key.slice(0, 30) + '...',
    })
  }
}
