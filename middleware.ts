import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

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
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const publicPaths = ['/privacy', '/terms']
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // Debug logs
  console.log('MW PATH:', request.nextUrl.pathname)
  console.log('MW SESSION:', !!session)
  console.log('MW isAuthPage:', isAuthPage)

  // 🔒 Protect routes
  if (!session && !isAuthPage && !publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // 🚫 Block auth pages if logged in
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}