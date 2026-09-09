import path from 'path'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { readdir, rm } from 'fs/promises'
import { readJson, withFileLock, writeJson } from './file-store'
import { seal, unseal } from './secrets'
import { sessionRevision } from './session-revisions'
import { disconnectSessionStreams } from './sse-manager'
import { ACCESS_TTL, REFRESH_TTL, REFRESH_GRACE } from './auth-config'
import type { AuthSession, AuthTokens, SessionPayload } from './auth-types'

type SessionRecord = {
  id: string
  email: string
  revision: string
  expiresAt: number
  revoked?: boolean
  credential: string
  refreshHash: string
  previous: { hash: string; until: number }[]
  issuedAt: number
  accessExpiresAt: number
  accessToken: string
  refreshValue: string
}

const directory = path.resolve(
  process.env.JMAIL_AUTH_SESSIONS_DIR ||
    path.join(
      path.dirname(
        process.env.JMAIL_SESSION_REVISIONS_FILE ||
          '/var/lib/maddy/jmail/session-revisions.json',
      ),
      'sessions',
    ),
)
const now = () => Math.floor(Date.now() / 1000)
const sessionPath = (id: string) => {
  if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Invalid session identifier')
  return path.join(directory, `${id}.json`)
}
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex')
const matches = (value: string, hash: string) =>
  /^[a-f0-9]{64}$/.test(hash) &&
  timingSafeEqual(Buffer.from(digest(value), 'hex'), Buffer.from(hash, 'hex'))
const parseRefresh = (token: string) =>
  /^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(token) ? token.slice(0, 32) : null

const readRecord = async (id: string) => {
  const record = await readJson<SessionRecord | null>(sessionPath(id), null)
  if (
    record &&
    (record.id !== id ||
      typeof record.email !== 'string' ||
      typeof record.revision !== 'string' ||
      !Number.isFinite(record.expiresAt) ||
      !Array.isArray(record.previous))
  )
    throw new Error('Session storage is unavailable')
  return record
}

const active = async (record: SessionRecord) =>
  !record.revoked &&
  record.expiresAt > now() &&
  record.revision === (await sessionRevision(record.email))

const payloadFrom = async (record: SessionRecord): Promise<SessionPayload> => {
  const payload = await unseal(record.credential, 'jmail-credential')
  if (
    payload.email !== record.email ||
    typeof payload.password !== 'string' ||
    typeof payload.domain !== 'string'
  )
    throw new Error('Session credentials are unavailable')
  return {
    email: record.email,
    password: payload.password,
    domain: payload.domain,
    ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
  }
}

const storedTokens = async (record: SessionRecord): Promise<AuthTokens> => {
  const value = await unseal(record.refreshValue, 'jmail-refresh-value')
  if (
    typeof value.token !== 'string' ||
    !matches(value.token, record.refreshHash)
  )
    throw new Error('Session credentials are unavailable')
  return {
    accessToken: record.accessToken,
    refreshToken: value.token,
    accessExpiresAt: record.accessExpiresAt,
    refreshExpiresAt: record.expiresAt,
  }
}

const issueTokens = async (record: SessionRecord): Promise<AuthTokens> => {
  const time = now()
  const refreshToken = `${record.id}.${randomBytes(32).toString('base64url')}`
  const accessExpiresAt = Math.min(time + ACCESS_TTL, record.expiresAt)
  const accessToken = await seal(
    { sid: record.id, email: record.email, revision: record.revision },
    'jmail-access',
    accessExpiresAt,
  )
  record.issuedAt = time
  record.accessExpiresAt = accessExpiresAt
  record.accessToken = accessToken
  record.refreshHash = digest(refreshToken)
  record.refreshValue = await seal(
    { token: refreshToken },
    'jmail-refresh-value',
    record.expiresAt,
  )
  await writeJson(sessionPath(record.id), record)
  return {
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt: record.expiresAt,
  }
}

const revokeRecord = async (record: SessionRecord) => {
  record.revoked = true
  record.credential = ''
  record.refreshValue = ''
  record.accessToken = ''
  await writeJson(sessionPath(record.id), record)
  disconnectSessionStreams(record.email, record.id)
}

let lastCleanup = 0
const cleanupExpired = async () => {
  if (Date.now() - lastCleanup < 60 * 60 * 1000) return
  lastCleanup = Date.now()
  try {
    const entries = await readdir(directory)
    for (const entry of entries) {
      if (!/^[a-f0-9]{32}\.json$/.test(entry)) continue
      const id = entry.slice(0, 32)
      const record = await readRecord(id)
      if (!record || record.expiresAt > now()) continue
      await withFileLock(sessionPath(id), async () => {
        const current = await readRecord(id)
        if (current && current.expiresAt <= now())
          await rm(sessionPath(id), { force: true })
      })
    }
  } catch {
    /* Best-effort expired session cleanup */
  }
}

export const createAuthSession = async (
  payload: SessionPayload,
  revision?: string,
  migrationId?: string,
): Promise<AuthTokens | null> => {
  const id = migrationId || randomBytes(16).toString('hex')
  const email = payload.email.trim().toLowerCase()
  const generation = revision ?? (await sessionRevision(email))
  const result = await withFileLock(sessionPath(id), async () => {
    const previous = await readRecord(id)
    if (previous) {
      if (!(await active(previous))) return null
      if (previous.accessExpiresAt > now()) return storedTokens(previous)
      previous.previous = [
        ...previous.previous.slice(-255),
        { hash: previous.refreshHash, until: now() + REFRESH_GRACE },
      ]
      return issueTokens(previous)
    }
    const expiresAt = now() + REFRESH_TTL
    const credential = await seal(
      {
        email,
        password: payload.password,
        domain: payload.domain,
        ...(payload.name ? { name: payload.name } : {}),
      },
      'jmail-credential',
      expiresAt,
    )
    return issueTokens({
      id,
      email,
      revision: generation,
      expiresAt,
      credential,
      previous: [],
      refreshHash: '',
      refreshValue: '',
      issuedAt: 0,
      accessExpiresAt: 0,
      accessToken: '',
    })
  })
  await cleanupExpired()
  return result
}

export const verifyAccessToken = async (
  token: string,
): Promise<AuthSession | null> => {
  let claims
  try {
    claims = await unseal(token, 'jmail-access')
  } catch {
    return null
  }
  if (
    typeof claims.sid !== 'string' ||
    !/^[a-f0-9]{32}$/.test(claims.sid) ||
    typeof claims.exp !== 'number'
  )
    return null
  const record = await readRecord(claims.sid)
  if (
    !record ||
    claims.email !== record.email ||
    claims.revision !== record.revision ||
    !(await active(record))
  )
    return null
  return {
    ...(await payloadFrom(record)),
    sessionId: record.id,
    accessExpiresAt: claims.exp,
    refreshExpiresAt: record.expiresAt,
  }
}

export const refreshAuthSession = async (
  token: string,
): Promise<AuthTokens | null> => {
  const id = parseRefresh(token)
  if (!id) return null
  return withFileLock(sessionPath(id), async () => {
    const record = await readRecord(id)
    if (!record || !(await active(record))) return null
    if (!matches(token, record.refreshHash)) {
      const previous = record.previous.find((item) => matches(token, item.hash))
      if (!previous) return null
      if (previous.until < now()) {
        await revokeRecord(record)
        return null
      }
      return storedTokens(record)
    }
    // Concurrent refreshes share the same replacement pair
    if (record.issuedAt + REFRESH_GRACE > now()) return storedTokens(record)
    record.previous = [
      ...record.previous.slice(-255),
      { hash: record.refreshHash, until: now() + REFRESH_GRACE },
    ]
    return issueTokens(record)
  })
}

const legacyIdentity = (token: string) => digest(`legacy:${token}`).slice(0, 32)
const legacyPayload = async (
  token: string,
): Promise<(SessionPayload & { revision: string }) | null> => {
  let payload
  try {
    payload = await unseal(token, 'jmail-session')
  } catch {
    return null
  }
  if (
    typeof payload.email !== 'string' ||
    typeof payload.password !== 'string' ||
    typeof payload.domain !== 'string' ||
    typeof payload.exp !== 'number'
  )
    return null
  const revision = typeof payload.revision === 'string' ? payload.revision : ''
  if (revision !== (await sessionRevision(payload.email))) return null
  return {
    email: payload.email,
    password: payload.password,
    domain: payload.domain,
    revision,
    ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
  }
}

export const migrateLegacySession = async (token: string) => {
  const payload = await legacyPayload(token)
  if (!payload) return null
  return createAuthSession(payload, payload.revision, legacyIdentity(token))
}

export const revokeAuthSession = async (
  access?: string,
  refresh?: string,
  legacy?: string,
) => {
  const session = access ? await verifyAccessToken(access) : null
  const refreshId = refresh ? parseRefresh(refresh) : null
  const old = legacy ? await legacyPayload(legacy) : null
  const ids = new Set(
    [
      session?.sessionId,
      refreshId,
      old && legacy ? legacyIdentity(legacy) : null,
    ].filter((id): id is string => Boolean(id)),
  )
  for (const id of ids)
    await withFileLock(sessionPath(id), async () => {
      const record = await readRecord(id)
      const legacyMatch = Boolean(
        old && legacy && id === legacyIdentity(legacy),
      )
      if (record) {
        if (record.revoked) return
        const refreshMatch = Boolean(
          refresh &&
          (matches(refresh, record.refreshHash) ||
            record.previous.some((item) => matches(refresh, item.hash))),
        )
        if (session?.sessionId === id || refreshMatch || legacyMatch)
          await revokeRecord(record)
      } else if (legacyMatch && old) {
        // Tombstone for legacy tokens that have not yet migrated
        await writeJson(sessionPath(id), {
          id,
          email: old.email,
          revision: old.revision,
          expiresAt: now() + REFRESH_TTL,
          revoked: true,
          credential: '',
          previous: [],
          refreshHash: '',
          refreshValue: '',
          issuedAt: 0,
          accessExpiresAt: 0,
          accessToken: '',
        } satisfies SessionRecord)
      }
    })
}
