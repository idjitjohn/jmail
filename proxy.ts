import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  // Auth-only routes: redirect logged-in users to inbox
  if (pathname === '/') {
    if (token) {
      const session = await verifySession(token)
      if (session) return NextResponse.redirect(new URL('/inbox', req.url))
    }
    return NextResponse.next()
  }

  // Protected routes: require valid session
  if (pathname.startsWith('/inbox') || pathname.startsWith('/admin') || pathname.startsWith('/settings')) {
    if (!token) return NextResponse.redirect(new URL('/', req.url))

    const session = await verifySession(token)
    if (!session) return NextResponse.redirect(new URL('/', req.url))

    // Admin routes: require admin email
    if (pathname.startsWith('/admin') && session.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/inbox', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/inbox/:path*', '/admin/:path*', '/settings/:path*'],
}
