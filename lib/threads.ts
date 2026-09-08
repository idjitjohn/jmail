import type { MailAddress, MailMessage, MailThread } from './types'

export const groupIntoThreads = (messages: MailMessage[]): MailThread[] => {
  const parent = new Map<string, string>()
  const root = (key: string): string => {
    if (!parent.has(key)) parent.set(key, key)
    if (parent.get(key) !== key) parent.set(key, root(parent.get(key)!))
    return parent.get(key)!
  }
  const identity = (message: MailMessage) =>
    `${message.folder}:${message.messageId || `uid-${message.uid}`}`
  for (const message of messages) {
    const key = identity(message)
    root(key)
    if (message.isDraft) continue
    for (const reference of [
      ...(message.references || []),
      ...(message.inReplyTo ? [message.inReplyTo] : []),
    ])
      parent.set(root(key), root(`${message.folder}:${reference}`))
  }
  const groups = new Map<string, MailMessage[]>()
  for (const message of messages) {
    const key = root(identity(message))
    groups.set(key, [...(groups.get(key) || []), message])
  }
  return [...groups]
    .map(([id, items]): MailThread => {
      const sorted = items.sort((a, b) => a.date.localeCompare(b.date))
      const participants: MailAddress[] = []
      const seen = new Set<string>()
      for (const message of sorted)
        if (!seen.has(message.from.address.toLowerCase())) {
          seen.add(message.from.address.toLowerCase())
          participants.push(message.from)
        }
      const latest = sorted[sorted.length - 1]
      return {
        id,
        subject: latest.subject.replace(/^((re|fwd?)\s*:\s*)+/gi, ''),
        messages: sorted,
        latest,
        unreadCount: sorted.filter((message) => !message.isRead).length,
        participants,
      }
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date))
}
