import type { SearchObject, MessageStructureObject } from 'imapflow'

export type MailFilter = 'all' | 'unread' | 'starred'

export const buildMailSearch = (
  query: string,
  filter: MailFilter,
): SearchObject => ({
  ...(filter === 'unread' ? { seen: false } : {}),
  ...(filter === 'starred' ? { flagged: true } : {}),
  ...(query
    ? {
        or: [
          { subject: query },
          { from: query },
          { to: query },
          { body: query },
        ],
      }
    : { all: true }),
})

export const hasMailAttachments = (
  structure?: MessageStructureObject,
): boolean => {
  if (!structure) return false
  return (
    structure.disposition?.toLowerCase() === 'attachment' ||
    (structure.childNodes?.some(hasMailAttachments) ?? false)
  )
}
