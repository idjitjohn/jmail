export type ComposeInit = {
  cc?: string
  bcc?: string
  attachments?: File[]
  draftUid?: number
  references?: string[]
  to?: string
  subject?: string
  body?: string
  inReplyTo?: string
}

export type ComposeOptions = ComposeInit & {
  isOpen: boolean
  userEmail: string
  onClose: () => void
  onSent?: (message: string) => void
}
