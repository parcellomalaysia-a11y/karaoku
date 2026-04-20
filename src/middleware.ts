import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if exists
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protect dashboard + party host routes
  const protectedPrefixes = ['/dashboard', '/party/']
  const needsAuth = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p))

  if (needsAuth && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/party/:path*'],
}
