import path from 'path'
import { randomUUID } from 'crypto'
import { readJson, writeJson, withFileLock } from './file-store'
import { seal, unseal } from './secrets'
import type { OutgoingMessage } from './outgoing'

const FILE = path.resolve(
  process.env.JMAIL_SCHEDULED_FILE || '/var/lib/maddy/jmail/scheduled.json',
)
export type ScheduledMessage = OutgoingMessage & {
  id: string
  sendAt: string
  userEmail: string
  userPassword: string
  name?: string
  status?: 'pending' | 'sending' | 'failed'
  error?: string
  claimedAt?: string
}
type StoredMessage = Omit<ScheduledMessage, 'userPassword'> & {
  credential: string
  userPassword?: string
}
const readAll = async (): Promise<StoredMessage[]> => {
  const rows = await readJson<StoredMessage[]>(FILE, [])
  let migrated = false
  for (const row of rows) {
    if (row.userPassword !== undefined) {
      row.credential = await seal(
        { password: row.userPassword },
        'jmail-scheduled',
      )
      delete row.userPassword
      migrated = true
    }
    row.bcc ||= ''
    row.status ||= 'pending'
    if (
      row.status === 'sending' &&
      Date.now() - new Date(row.claimedAt || 0).getTime() > 15 * 60000
    ) {
      row.status = 'failed'
      row.error =
        'Delivery was interrupted. Check Sent and the recipient before scheduling again.'
      migrated = true
    }
  }
  if (migrated) await writeJson(FILE, rows)
  return rows
}
export const addScheduled = async (message: Omit<ScheduledMessage, 'id'>) =>
  withFileLock(FILE, async () => {
    const rows = await readAll()
    const { userPassword, ...rest } = message
    const id = randomUUID()
    rows.push({
      ...rest,
      id,
      status: 'pending',
      credential: await seal({ password: userPassword }, 'jmail-scheduled'),
    })
    await writeJson(FILE, rows)
    return id
  })
export const listScheduled = async (email: string) =>
  withFileLock(FILE, async () =>
    (await readAll())
      .filter((row) => row.userEmail === email)
      .map(({ credential: _credential, userPassword: _password, ...row }) => {
        void _credential
        void _password
        return row
      })
      .sort((a, b) => a.sendAt.localeCompare(b.sendAt)),
  )
export const changeScheduled = async (
  email: string,
  id: string,
  sendAt?: string,
  password?: string,
) =>
  withFileLock(FILE, async () => {
    const rows = await readAll()
    const row = rows.find((item) => item.id === id && item.userEmail === email)
    if (!row) throw new Error('Scheduled message not found.')
    if (row.status === 'sending')
      throw new Error('This message is being sent and cannot be changed.')
    if (sendAt) {
      if (password) row.credential = await seal({ password }, 'jmail-scheduled')
      row.sendAt = sendAt
      row.status = 'pending'
      delete row.error
    }
    await writeJson(FILE, sendAt ? rows : rows.filter((item) => item !== row))
  })
export const claimDue = async (): Promise<ScheduledMessage[]> =>
  withFileLock(FILE, async () => {
    const rows = await readAll()
    const due = rows
      .filter(
        (row) =>
          row.status === 'pending' && row.sendAt <= new Date().toISOString(),
      )
      .slice(0, 10)
    const messages: ScheduledMessage[] = []
    for (const row of due) {
      try {
        const payload = await unseal(row.credential, 'jmail-scheduled')
        if (typeof payload.password !== 'string')
          throw new Error('Missing credentials')
        row.status = 'sending'
        row.claimedAt = new Date().toISOString()
        const { credential: _credential, ...message } = row
        void _credential
        messages.push({ ...message, userPassword: payload.password })
      } catch {
        row.status = 'failed'
        row.error =
          'Sign in and recreate this scheduled message to update its credentials.'
      }
    }
    await writeJson(FILE, rows)
    return messages
  })
export const finishScheduled = async (id: string, error?: string) =>
  withFileLock(FILE, async () => {
    const rows = await readAll()
    const row = rows.find((item) => item.id === id)
    if (row && error) {
      row.status = 'failed'
      row.error = error
    }
    await writeJson(FILE, error ? rows : rows.filter((item) => item.id !== id))
  })
