import type { SearchObject, MessageStructureObject } from 'imapflow'

export type MailFilter = 'all' | 'unread' | 'starred'

export type SearchFields = {
  from?: string
  to?: string
  subject?: string
  after?: string
  before?: string
}

export const buildMailSearch = (
  query: string,
  filter: MailFilter,
  fields: SearchFields = {},
): SearchObject => {
  const search: SearchObject = {
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
  }
  for (const key of ['from', 'to', 'subject'] as const)
    if (fields[key]?.trim()) search[key] = fields[key].trim()
  for (const key of ['after', 'before'] as const) {
    if (!fields[key]) continue
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fields[key]) ||
      !Number.isFinite(new Date(fields[key]).getTime())
    )
      throw new Error('Enter a valid search date.')
    search[key === 'after' ? 'since' : 'before'] = new Date(fields[key])
  }
  return search
}

export const hasMailAttachments = (
  structure?: MessageStructureObject,
): boolean => {
  if (!structure) return false
  return (
    structure.disposition?.toLowerCase() === 'attachment' ||
    (structure.childNodes?.some(hasMailAttachments) ?? false)
  )
}
