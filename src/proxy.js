import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
 const isPublicPage = req.nextUrl.pathname === '/' ||
                      req.nextUrl.pathname.startsWith('/login') ||
                      req.nextUrl.pathname.startsWith('/cadastro')

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isLoggedIn && (
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/cadastro')
  )) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}