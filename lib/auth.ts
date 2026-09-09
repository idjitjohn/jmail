import { seal, unseal } from './secrets'
import type { UserSession } from './types'
import { sessionRevision } from './session-revisions'

export type SessionPayload = UserSession & {
  password: string
}

export async function createSession(
  payload: SessionPayload,
  revision?: string,
): Promise<string> {
  return seal(
    {
      ...payload,
      revision: revision ?? (await sessionRevision(payload.email)),
    },
    'jmail-session',
    '24h',
  )
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  let payload
  try {
    payload = await unseal(token, 'jmail-session')
  } catch {
    return null
  }
  if (
    typeof payload.email !== 'string' ||
    typeof payload.password !== 'string' ||
    typeof payload.domain !== 'string'
  )
    return null
  if ((payload.revision || '') !== (await sessionRevision(payload.email)))
    return null
  return {
    email: payload.email as string,
    domain: payload.domain as string,
    password: payload.password as string,
    name: payload.name as string | undefined,
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
