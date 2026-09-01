import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register') ||
    nextUrl.pathname.startsWith('/forgot-password')

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = nextUrl.pathname === '/'
  const isApiRoute = nextUrl.pathname.startsWith('/api/')

  // Permitir rotas públicas e rotas de autenticação
  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next()
  }

  // Deixar as rotas da API lidarem com sua própria autenticação (exceto auth routes acima)
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Se o usuário tentar acessar a página de login já autenticado, redireciona para o dashboard
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Rotas protegidas (todas as outras que chegam aqui) - redireciona se não estiver logado
  if (!isLoggedIn) {
    const redirectUrl = new URL('/login', nextUrl)
    redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
