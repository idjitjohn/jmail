import { NextRequest, NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { setAuthCookies } from '@/lib/auth-cookies'
import { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE } from '@/lib/auth-config'
import { isSameOriginRequest } from '@/lib/request-origin'

export const POST = async (request: NextRequest) => {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    const { session, tokens } = await resolveAuth(
      request.cookies.get(ACCESS_COOKIE)?.value,
      request.cookies.get(REFRESH_COOKIE)?.value,
      request.cookies.get(LEGACY_COOKIE)?.value,
    )
    if (!session)
      return NextResponse.json(
        {
          error: 'Your session has expired. Sign in again to continue.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
      )
    const response = NextResponse.json(
      {
        ok: true,
        accessExpiresAt: session.accessExpiresAt,
        refreshExpiresAt: session.refreshExpiresAt,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
    return tokens ? setAuthCookies(response, tokens) : response
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
