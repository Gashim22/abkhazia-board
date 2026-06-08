import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Маршруты только для авторизованных пользователей
const PROTECTED = ['/create', '/profile', '/messages']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Проверяем только защищённые маршруты
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  // Создаём response-объект, который middleware может модифицировать
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Supabase SSR клиент с поддержкой cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Получаем сессию пользователя
  const { data: { session } } = await supabase.auth.getSession()

  // Если не авторизован — редирект на /login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/create/:path*', '/profile/:path*', '/messages/:path*'],
}
