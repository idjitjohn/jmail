export interface MailAddress {
  name?: string
  address: string
}

export interface MailMessage {
  uid: number
  messageId?: string
  subject: string
  from: MailAddress
  to: MailAddress[]
  cc?: MailAddress[]
  bcc?: MailAddress[]
  date: string
  preview?: string
  html?: string
  text?: string
  isRead: boolean
  hasAttachments: boolean
  folder: string
  size?: number
}

export interface MailFolder {
  name: string
  path: string
  unread: number
  delimiter?: string
  specialUse?: string
}

export interface ComposeData {
  to: string
  cc: string
  subject: string
  body: string
  replyTo?: string
  inReplyTo?: string
}

export interface UserSession {
  email: string
  domain: string
  name?: string
}

export interface MailListState {
  messages: MailMessage[]
  loading: boolean
  error: string | null
  page: number
  hasMore: boolean
  folder: string
  selectedUid: number | null
}

export interface FolderCounts {
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
