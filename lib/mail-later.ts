import path from 'path'
import { randomUUID } from 'crypto'
import { withFileLock, readJson, writeJson } from './file-store'
import { seal, unseal } from './secrets'
import { createImapClient } from './mail'
import type { SessionPayload } from './auth'

const FILE = path.resolve(
  process.env.JMAIL_LATER_FILE || '/var/lib/maddy/jmail/later.json',
)
export type LaterItem = {
  id: string
  email: string
  credential: string
  mode: 'snooze' | 'reminder'
  status: 'pending' | 'processing' | 'due' | 'failed'
  dueAt: string
  folder: string
  uid: number
  uidValidity: string
  subject: string
  messageId?: string
  returnTo?: string
  error?: string
  claimedAt?: string
}
const update = <T>(fn: (rows: LaterItem[]) => Promise<T>) =>
  withFileLock(FILE, async () => {
    const rows = await readJson<LaterItem[]>(FILE, [])
    const result = await fn(rows)
    await writeJson(FILE, rows)
    return result
  })
export const listLater = (email: string) =>
  update(async (rows) =>
    rows
      .filter((row) => row.email === email)
      .map(({ credential: _credential, ...row }) => {
        void _credential
        return row
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  )
export const createLater = async (
  session: SessionPayload,
  input: { uid: number; folder: string; mode: string; dueAt: string },
) => {
  if (!process.env.CRON_SECRET)
    throw new Error('Reminders are not configured. Contact your administrator.')
  if (
    !Number.isSafeInteger(input.uid) ||
    input.uid < 1 ||
    typeof input.folder !== 'string' ||
    !['snooze', 'reminder'].includes(input.mode)
  )
    throw new Error('Choose a valid message and reminder.')
  const date = new Date(input.dueAt)
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
    throw new Error('Choose a time in the future.')
  const client = createImapClient(session.email, session.password)
  const id = randomUUID()
  let recorded = false
  try {
    await client.connect()
    const mailbox = await client.mailboxOpen(input.folder)
    const message = await client.fetchOne(
      String(input.uid),
      { envelope: true, flags: true },
      { uid: true },
    )
    if (!message) throw new Error('Message not found.')
    if (message.flags?.has('\\Draft'))
      throw new Error('Finish writing this draft before creating a reminder.')
    if (input.folder === 'Snoozed')
      throw new Error(
        'This message is already snoozed. Use Later to bring it back.',
      )
    const row: LaterItem = {
      id,
      email: session.email,
      credential: await seal({ password: session.password }, 'jmail-later'),
      mode: input.mode as LaterItem['mode'],
      status: 'processing',
      claimedAt: new Date().toISOString(),
      dueAt: date.toISOString(),
      uid: input.uid,
      uidValidity: String(mailbox.uidValidity),
      folder: input.folder,
      subject: message.envelope?.subject || '(no subject)',
      messageId: message.envelope?.messageId,
    }
    await update(async (rows) => {
      if (rows.filter((item) => item.email === session.email).length >= 500)
        throw new Error('You can keep up to 500 reminders.')
      rows.push(row)
    })
    recorded = true
    if (row.mode === 'snooze') {
      const folders = await client.list()
      if (!folders.some((folder) => folder.path === 'Snoozed'))
        await client.mailboxCreate('Snoozed')
      const moved = await client.messageMove(String(input.uid), 'Snoozed', {
        uid: true,
      })
      const uid = moved && moved.uidMap?.get(input.uid)
      if (!uid)
        throw new Error(
          'The move could not be confirmed. Check the Snoozed folder before trying again.',
        )
      const snoozed = await client.mailboxOpen('Snoozed')
      row.returnTo = input.folder
      row.folder = 'Snoozed'
      row.uid = uid
      row.uidValidity = String(snoozed.uidValidity)
    }
    row.status = 'pending'
    await update(async (rows) => {
      const index = rows.findIndex((item) => item.id === id)
      if (index >= 0) rows[index] = row
    })
    return id
  } catch (error) {
    if (recorded)
      await update(async (rows) => {
        const row = rows.find((item) => item.id === id)
        if (row) {
          row.status = 'failed'
          row.error =
            error instanceof Error
              ? error.message
              : 'Check this message before trying again.'
        }
      })
    throw error
  } finally {
    await client.logout().catch(() => client.close())
  }
}
export const changeLater = (
  email: string,
  id: string,
  action: string,
  password?: string,
) =>
  update(async (rows) => {
    if (typeof id !== 'string' || !['restore', 'dismiss'].includes(action))
      throw new Error('Choose a valid reminder action.')
    const index = rows.findIndex((row) => row.id === id && row.email === email)
    if (index < 0) throw new Error('Reminder not found.')
    const row = rows[index]
    if (row.status === 'processing')
      throw new Error('This message is being processed. Try again shortly.')
    if (row.mode === 'snooze' && action === 'restore') {
      if (password) row.credential = await seal({ password }, 'jmail-later')
      row.dueAt = new Date().toISOString()
      row.status = 'pending'
      delete row.error
    } else if (row.mode === 'reminder' || row.status === 'failed')
      rows.splice(index, 1)
    else
      throw new Error('Bring this message back before removing its reminder.')
  })
export const processLater = async () => {
  const jobs = await update(async (rows) => {
    for (const row of rows)
      if (
        row.status === 'processing' &&
        Date.now() - new Date(row.claimedAt || 0).getTime() > 15 * 60000
      ) {
        row.status = 'failed'
        row.error =
          'Processing was interrupted. Check the original and Snoozed folders.'
      }
    const due = rows
      .filter(
        (row) =>
          row.status === 'pending' && row.dueAt <= new Date().toISOString(),
      )
      .slice(0, 20)
    for (const row of due) {
      row.status = 'processing'
      row.claimedAt = new Date().toISOString()
    }
    return due
  })
  for (const job of jobs) {
    let client: ReturnType<typeof createImapClient> | undefined
    try {
      const payload = await unseal(job.credential, 'jmail-later')
      if (typeof payload.password !== 'string')
        throw new Error('Sign in and recreate this reminder.')
      client = createImapClient(job.email, payload.password)
      await client.connect()
      let resolved = false
      if (job.mode === 'snooze') {
        const folder = await client.mailboxOpen(job.folder)
        if (String(folder.uidValidity) !== job.uidValidity)
          throw new Error(
            'This mailbox changed. Check the Snoozed folder and move the message manually.',
          )
        const message = await client.fetchOne(
          String(job.uid),
          { uid: true },
          { uid: true },
        )
        if (message) {
          const folders = await client.list()
          const destination = folders.some((item) => item.path === job.returnTo)
            ? job.returnTo!
            : 'INBOX'
          await client.messageFlagsRemove(String(job.uid), ['\\Seen'], {
            uid: true,
          })
          await client.messageMove(String(job.uid), destination, { uid: true })
        }
        resolved = true
      } else if (job.messageId) {
        await client.mailboxOpen('INBOX')
        const replies = await client.search(
          {
            or: [
              { header: { 'in-reply-to': job.messageId } },
              { header: { references: job.messageId } },
            ],
          },
          { uid: true },
        )
        resolved = Array.isArray(replies) && replies.length > 0
      }
      await update(async (rows) => {
        const index = rows.findIndex((row) => row.id === job.id)
        if (index >= 0) {
          if (resolved) rows.splice(index, 1)
          else rows[index].status = 'due'
        }
      })
    } catch (error) {
      await update(async (rows) => {
        const row = rows.find((item) => item.id === job.id)
        if (row) {
          row.status = 'failed'
          row.error =
            error instanceof Error
              ? error.message
              : 'Could not process this reminder.'
        }
      })
    } finally {
      if (client) await client.logout().catch(() => client?.close())
    }
  }
  return jobs.length
}
