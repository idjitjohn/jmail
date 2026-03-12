import { createImapClient } from './mail'
import { broadcast, hasSubscribers } from './sse-manager'

interface PoolEntry {
  running: boolean
}

// Global singleton — survives hot reload in dev
const g = globalThis as any
if (!g._imapPool) g._imapPool = new Map<string, PoolEntry>()
const pool: Map<string, PoolEntry> = g._imapPool

export function startIdleMonitor(email: string, password: string): void {
  if (pool.has(email)) return
  const entry: PoolEntry = { running: true }
  pool.set(email, entry)
  void runIdleLoop(email, password, entry)
}

export function stopIdleMonitor(email: string): void {
  const entry = pool.get(email)
  if (!entry) return
  entry.running = false
  pool.delete(email)
}

async function runIdleLoop(email: string, password: string, entry: PoolEntry): Promise<void> {
  while (entry.running) {
    const client = createImapClient(email, password)
    try {
      await client.connect()
      const lock = await client.getMailboxLock('INBOX')

      client.on('exists', (data: { path: string; count: number }) => {
        if (!hasSubscribers(email)) { entry.running = false; return }
        broadcast(email, { type: 'new_mail', folder: data.path, count: data.count })
      })

      client.on('flags', (data: { path: string; uid: number; flags: Set<string> }) => {
        if (!data.uid) return
        broadcast(email, {
          type: 'flag_update',
          folder: data.path,
          uid: data.uid,
          isRead: data.flags?.has('\\Seen') ?? false,
        })
      })

      client.on('expunge', (data: { path: string }) => {
        broadcast(email, { type: 'mail_expunged', folder: data.path })
      })

      while (entry.running) {
        try { await client.idle() } catch { break }
      }

      lock.release()
      try { await client.logout() } catch { client.close() }
    } catch {
      try { client.close() } catch { /* ignore */ }
    }

    // Reconnect delay on failure
    if (entry.running) await new Promise(r => setTimeout(r, 5_000))
  }

  pool.delete(email)
}
