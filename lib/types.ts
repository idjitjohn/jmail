export type MailAddress = {
  name?: string
  address: string
}

export type MailAttachment = {
  filename: string
  contentType: string
  size: number
  partId: string
  contentId?: string
  inline?: boolean
}

export type MailMessage = {
  uid: number
  messageId?: string
  inReplyTo?: string
  references?: string[]
  subject: string
  from: MailAddress
  to: MailAddress[]
  cc?: MailAddress[]
  bcc?: MailAddress[]
  date: string
  preview?: string
  remoteImagesBlocked?: boolean
  isDraft?: boolean
  html?: string
  text?: string
  isRead: boolean
  isFlagged: boolean
  hasAttachments: boolean
  attachments?: MailAttachment[]
  folder: string
  size?: number
}

export type MailThread = {
  id: string // normalized subject key
  subject: string // display subject (Re:/Fwd: stripped)
  messages: MailMessage[] // oldest → newest
  latest: MailMessage
  unreadCount: number
  participants: MailAddress[]
}

export type MailFolder = {
  name: string
  path: string
  unread: number
  delimiter?: string
  specialUse?: string
}

export type ComposeData = {
  to: string
  cc: string
  subject: string
  body: string
  replyTo?: string
  inReplyTo?: string
}

export type UserSession = {
  email: string
  domain: string
  name?: string
}

export type MailListState = {
  messages: MailMessage[]
  loading: boolean
  error: string | null
  page: number
  hasMore: boolean
  folder: string
  selectedUid: number | null
}

export type FolderCounts = {
  [path: string]: number
}

// Well-known folder paths
export const FOLDER_ICONS: Record<string, string> = {
  INBOX: '📥',
  Sent: '📤',
  Drafts: '✏️',
  Trash: '🗑️',
  Spam: '⚠️',
  Archive: '📦',
}

export const FOLDER_LABELS: Record<string, string> = {
  INBOX: 'Inbox',
  Sent: 'Sent',
  Drafts: 'Drafts',
  Trash: 'Trash',
  Spam: 'Spam',
  Archive: 'Archive',
}

export type SSEEvent =
  | { type: 'connected' }
  | { type: 'ping' }
  | { type: 'new_mail'; folder: string; count: number }
  | { type: 'flag_update'; folder: string; uid: number; isRead: boolean }
  | { type: 'mail_expunged'; folder: string }
  | { type: 'unread_counts'; counts: Record<string, number> }
