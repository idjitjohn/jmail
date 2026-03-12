import type { MailAddress, MailMessage, MailThread } from './types'

// Strip Re:/Fwd: prefixes (any depth) for grouping key
function normalizeSubject(s: string): string {
  return s.replace(/^((re|fwd?)\s*:\s*)+/gi, '').trim().toLowerCase()
}

// Strip prefixes for display
function baseSubject(s: string): string {
  return s.replace(/^((re|fwd?)\s*:\s*)+/gi, '').trim()
}

export function groupIntoThreads(messages: MailMessage[]): MailThread[] {
  const map = new Map<string, MailMessage[]>()

  for (const msg of messages) {
    const key = normalizeSubject(msg.subject) || msg.messageId || String(msg.uid)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(msg)
  }

  const threads: MailThread[] = []

  for (const [id, msgs] of map) {
    // Sort oldest → newest within thread
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const latest = sorted[sorted.length - 1]
    const unreadCount = msgs.filter(m => !m.isRead).length

    // Unique participants in order of appearance
    const seen = new Set<string>()
    const participants: MailAddress[] = []
    for (const msg of sorted) {
      if (!seen.has(msg.from.address)) {
        seen.add(msg.from.address)
        participants.push(msg.from)
      }
    }

    threads.push({
      id,
      subject: baseSubject(latest.subject) || '(no subject)',
      messages: sorted,
      latest,
      unreadCount,
      participants,
    })
  }

  // Newest thread first
  threads.sort((a, b) => new Date(b.latest.date).getTime() - new Date(a.latest.date).getTime())

  return threads
}
