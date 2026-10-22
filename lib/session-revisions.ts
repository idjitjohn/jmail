import { randomUUID } from 'crypto'
import { readJson, withFileLock, writeJson } from './file-store'
import { disconnectStreams } from './sse-manager'
import { SESSION_REVISIONS_FILE } from './data-paths'

const file = SESSION_REVISIONS_FILE

export const sessionRevision = async (email: string) => {
  email = email.trim().toLowerCase()
  const revisions = await readJson<Record<string, string>>(file, {})
  return Object.hasOwn(revisions, email) ? revisions[email] : ''
}

export const revokeSessions = (email: string, revision = randomUUID()) =>
  withFileLock(file, async () => {
    email = email.trim().toLowerCase()
    const revisions = await readJson<Record<string, string>>(file, {})
    await writeJson(file, { ...revisions, [email]: revision })
    disconnectStreams(email)
  })
