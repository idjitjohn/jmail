import { SignJWT, jwtVerify } from 'jose'
import type { UserSession } from './types'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
)

export interface SessionPayload extends UserSession {
  password: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return {
      email: payload.email as string,
      domain: payload.domain as string,
      password: payload.password as string,
      name: payload.name as string | undefined,
    }
  } catch {
    return null
  }
}

export function extractDomain(email: string): string {
  return email.split('@')[1] || ''
}

// Server-only helpers (not used in proxy/edge)
export async function getSession(): Promise<SessionPayload | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return verifySession(token)
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
