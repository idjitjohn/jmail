export type ComposeState = {
  to: string
  subject: string
  body?: string
  inReplyTo?: string
}

export type MobilePanel = 'sidebar' | 'list' | 'message'
