import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED FOR DEBUGGING
  // Skip API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Return NextResponse.next() to disable auth protection temporarily
  return NextResponse.next()

  /* ORIGINAL CODE:
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
    const redirectUrl = new URL('/auth/signin', request.url)
    response = NextResponse.redirect(redirectUrl)
    return response
  }

  // 🚫 Block auth pages if logged in
  if (session && isAuthPage) {
    const redirectUrl = new URL('/', request.url)
    response = NextResponse.redirect(redirectUrl)
    return response
  }

  return response
  */
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}