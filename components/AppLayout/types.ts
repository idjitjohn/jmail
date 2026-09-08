export type ComposeState = {
  cc?: string
  bcc?: string
  attachments?: File[]
  draftUid?: number
  references?: string[]
  to: string
  subject: string
  body?: string
  inReplyTo?: string
}

export type MobilePanel = 'sidebar' | 'list' | 'message'
