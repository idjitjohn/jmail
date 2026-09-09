import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE } from './auth-config'
import type { AuthTokens } from './auth-types'

const options = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
})

export const setAuthCookies = (response: NextResponse, tokens: AuthTokens) => {
  const now = Math.floor(Date.now() / 1000)
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...options(),
    maxAge: Math.max(0, tokens.accessExpiresAt - now),
    expires: new Date(tokens.accessExpiresAt * 1000),
  })
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...options(),
    maxAge: Math.max(0, tokens.refreshExpiresAt - now),
    expires: new Date(tokens.refreshExpiresAt * 1000),
  })
  response.cookies.set(LEGACY_COOKIE, '', { ...options(), maxAge: 0 })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const clearAuthCookies = (response: NextResponse) => {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE])
    response.cookies.set(name, '', { ...options(), maxAge: 0 })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
