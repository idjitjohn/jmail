import {
  verifyAccessToken,
  refreshAuthSession,
  migrateLegacySession,
} from './auth-sessions'
import { ACCESS_COOKIE, REFRESH_EARLY } from './auth-config'
import type { AuthSession, AuthTokens } from './auth-types'

export type { SessionPayload, AuthTokens, AuthSession } from './auth-types'
export { createAuthSession as createSession } from './auth-sessions'
export const verifySession = verifyAccessToken

export const resolveAuth = async (
  access?: string,
  refresh?: string,
  legacy?: string,
): Promise<{ session: AuthSession | null; tokens: AuthTokens | null }> => {
  const current = access ? await verifyAccessToken(access) : null
  if (
    current &&
    (!refresh ||
      current.accessExpiresAt > Math.floor(Date.now() / 1000) + REFRESH_EARLY)
  )
    return { session: current, tokens: null }
  const tokens = refresh
    ? await refreshAuthSession(refresh)
    : legacy
      ? await migrateLegacySession(legacy)
      : null
  if (tokens)
    return { session: await verifyAccessToken(tokens.accessToken), tokens }
  // Revalidation after a possible refresh replay revocation
  return {
    session: current && access ? await verifyAccessToken(access) : null,
    tokens: null,
  }
}

export const extractDomain = (email: string) => email.split('@')[1] || ''

export const getSession = async (): Promise<AuthSession | null> => {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const token = store.get(ACCESS_COOKIE)?.value
  return token ? verifyAccessToken(token) : null
}

export const unauthorized = () =>
  Response.json(
    { error: 'Unauthorized', code: 'SESSION_EXPIRED' },
    { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
  )
