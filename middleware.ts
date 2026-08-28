import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // Check for the NextAuth session token cookie (works in both dev and prod)
  const token =
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-next-auth.session-token') ??
    req.cookies.get('next-auth.session-token')

  const isLoggedIn = !!token

  const isAuthPage =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register') ||
    nextUrl.pathname.startsWith('/forgot-password')

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = nextUrl.pathname === '/'
  const isApiRoute = nextUrl.pathname.startsWith('/api/')

  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next()
  }

  // Let API routes handle their own auth
  if (isApiRoute) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const redirectUrl = new URL('/login', nextUrl)
    redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
