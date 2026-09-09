import { NextRequest, NextResponse } from 'next/server'
import { revokeAuthSession } from '@/lib/auth-sessions'
import { clearAuthCookies } from '@/lib/auth-cookies'
import { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE } from '@/lib/auth-config'
import { isSameOriginRequest } from '@/lib/request-origin'

export const POST = async (request: NextRequest) => {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    await revokeAuthSession(
      request.cookies.get(ACCESS_COOKIE)?.value,
      request.cookies.get(REFRESH_COOKIE)?.value,
      request.cookies.get(LEGACY_COOKIE)?.value,
    )
    return clearAuthCookies(NextResponse.json({ ok: true }))
  } catch {
    return NextResponse.json(
      {
        error: 'Could not sign out. Please try again.',
        code: 'SESSION_UNAVAILABLE',
      },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }
}
