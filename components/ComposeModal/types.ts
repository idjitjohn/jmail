export type ComposeInit = {
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
