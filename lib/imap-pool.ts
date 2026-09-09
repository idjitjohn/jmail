import { createHash } from 'crypto'
import { createImapClient } from './mail'
import { broadcast, hasSubscribers } from './sse-manager'

type PoolEntry = {
  running: boolean
  credential: string
  client?: ReturnType<typeof createImapClient>
}

const globalPool = globalThis as typeof globalThis & {
  _imapPool?: Map<string, PoolEntry>
}
const pool = (globalPool._imapPool ||= new Map<string, PoolEntry>())

export const stopIdleMonitor = (email: string) => {
  const entry = pool.get(email)
  if (!entry) return
  entry.running = false
  entry.client?.close()
  pool.delete(email)
}

const runIdleLoop = async (
  email: string,
  password: string,
  entry: PoolEntry,
) => {
  while (entry.running && hasSubscribers(email)) {
    const client = createImapClient(email, password)
    entry.client = client
    try {
      await client.connect()
      const lock = await client.getMailboxLock('INBOX')
      try {
        client.on('exists', (data) => {
          if (entry.running)
            broadcast(email, {
              type: 'new_mail',
              folder: data.path,
              count: data.count,
            })
        })
        client.on('flags', (data) => {
          if (entry.running && data.uid)
            broadcast(email, {
              type: 'flag_update',
              folder: data.path,
              uid: data.uid,
              isRead: data.flags?.has('\\Seen') ?? false,
            })
        })
        client.on('expunge', (data) => {
          if (entry.running)
            broadcast(email, { type: 'mail_expunged', folder: data.path })
        })
        while (entry.running && hasSubscribers(email)) await client.idle()
      } finally {
        lock.release()
      }
    } catch {
      /* Reconnection after socket or authentication failure */
    } finally {
      client.close()
      entry.client = undefined
    }
    if (entry.running && hasSubscribers(email))
      await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  if (pool.get(email) === entry) pool.delete(email)
}

export const startIdleMonitor = (email: string, password: string) => {
  const credential = createHash('sha256').update(password).digest('hex')
  if (pool.get(email)?.credential === credential) return
  stopIdleMonitor(email)
  const entry: PoolEntry = { running: true, credential }
  pool.set(email, entry)
  void runIdleLoop(email, password, entry)
}
