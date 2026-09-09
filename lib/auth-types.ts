import type { UserSession } from './types'

export type SessionPayload = UserSession & { password: string }

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number
  refreshExpiresAt: number
}

export type AuthSession = SessionPayload & {
  sessionId: string
  accessExpiresAt: number
  refreshExpiresAt: number
}
