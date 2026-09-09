import type { MailFolder } from '@/lib/types'
import type { Locale } from './config'
import { translate } from './translate'

const systemNames: Record<string, string> = {
  INBOX: 'Inbox',
  Sent: 'Sent',
  Drafts: 'Drafts',
  Trash: 'Trash',
  Spam: 'Spam',
  Junk: 'Spam',
  Archive: 'Archive',
  Snoozed: 'Snoozed',
}
const specialNames: Record<string, string> = {
  '\\Sent': 'Sent',
  '\\Drafts': 'Drafts',
  '\\Trash': 'Trash',
  '\\Junk': 'Spam',
  '\\Archive': 'Archive',
}

export const folderLabel = (
  folder: Pick<MailFolder, 'path' | 'name' | 'specialUse'>,
  locale: Locale,
) => {
  const special =
    folder.specialUse && Object.hasOwn(specialNames, folder.specialUse)
      ? specialNames[folder.specialUse]
      : undefined
  const builtIn =
    special ||
    (Object.hasOwn(systemNames, folder.path)
      ? systemNames[folder.path]
      : undefined)
  return builtIn ? translate(locale, builtIn) : folder.name
}
