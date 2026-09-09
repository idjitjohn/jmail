import { NextRequest, NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { setAuthCookies } from '@/lib/auth-cookies'
import { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE } from '@/lib/auth-config'
import { isSameOriginRequest } from '@/lib/request-origin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const proxy = async (req: NextRequest) => {
  const { pathname } = req.nextUrl
  const api = pathname.startsWith('/api/')
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    !isSameOriginRequest(req)
  )
    return NextResponse.json(
      {
        error: 'Reload JMail before trying this action again.',
        code: 'INVALID_ORIGIN',
      },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    )

  // Dedicated authentication and bearer-only scheduler routes
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/cron/')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  try {
    const { session, tokens } = await resolveAuth(
      req.cookies.get(ACCESS_COOKIE)?.value,
      req.cookies.get(REFRESH_COOKIE)?.value,
      req.cookies.get(LEGACY_COOKIE)?.value,
    )
    let response: NextResponse
    if (api && !session) {
      response = NextResponse.json(
        {
          error: 'Your session has expired. Sign in again to continue.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 },
      )
    } else if (pathname === '/' && session) {
      response = NextResponse.redirect(new URL('/inbox', req.url))
    } else if (pathname !== '/' && !session) {
      response = NextResponse.redirect(new URL('/', req.url))
    } else if (
      pathname.startsWith('/admin') &&
      session?.email !== ADMIN_EMAIL
    ) {
      response = NextResponse.redirect(new URL('/inbox', req.url))
    } else {
      if (tokens && session) {
        // Renewed credentials for this request, without replaying its body
        req.cookies.set(ACCESS_COOKIE, tokens.accessToken)
        req.cookies.set(REFRESH_COOKIE, tokens.refreshToken)
        req.cookies.delete(LEGACY_COOKIE)
      }
      response = NextResponse.next({ request: { headers: req.headers } })
    }
    response.headers.set('Cache-Control', 'private, no-store')
    return tokens && session ? setAuthCookies(response, tokens) : response
  } catch {
    return NextResponse.json(
      {
        error: 'Your session is temporarily unavailable. Please try again.',
        code: 'SESSION_UNAVAILABLE',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '5' },
      },
    )
  }
}

export const config = {
  matcher: [
    '/',
    '/inbox/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/api/:path*',
  ],
}
