import { readFile, mkdir } from 'fs/promises'
import { withFileLock, writeJson } from './file-store'
import type { ReplyTemplate } from './reply-templates'
import path from 'path'
import type { Contact } from './contacts'
import type { MailPreferences } from './preferences'

const DATA_DIR = path.resolve(
  process.env.JMAIL_USERDATA_DIR || '/var/lib/maddy/userdata',
)

export type UserData = {
  contacts?: Contact[]
  diagnosticHistory?: {
    id: string
    at: string
    mode: string
    target: string
    result: import('@/components/MailServerAdmin/types').DiagnosticResult
  }[]
  preferences?: MailPreferences
  name?: string
  signature?: string
  replyTemplates?: ReplyTemplate[]
}

function getDataPath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._%+-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(DATA_DIR, `${safe}.json`)
  if (!full.startsWith(DATA_DIR + '/')) throw new Error('Path traversal')
  return full
}

export async function getUserData(email: string): Promise<UserData> {
  try {
    const content = await readFile(getDataPath(email), 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

const pendingWrites = new Map<string, Promise<void>>()

export const updateUserData = async (
  email: string,
  update: (current: UserData) => UserData,
): Promise<void> => {
  const previous = pendingWrites.get(email) ?? Promise.resolve()
  const next = previous
    .catch(() => {})
    .then(async () => {
      await mkdir(DATA_DIR, { recursive: true, mode: 0o700 })
      await withFileLock(getDataPath(email), async () => {
        const current = await getUserData(email)
        const destination = getDataPath(email)
        await writeJson(destination, update(current))
      })
    })
  pendingWrites.set(email, next)
  try {
    await next
  } finally {
    if (pendingWrites.get(email) === next) pendingWrites.delete(email)
  }
}

export const setUserData = (
  email: string,
  patch: Partial<UserData>,
): Promise<void> =>
  updateUserData(email, (current) => ({ ...current, ...patch }))
