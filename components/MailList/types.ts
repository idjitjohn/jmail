import type { MailThread } from '@/lib/types'

export type MailListOptions = {
  folder: string
  refreshTrigger: number
  selectedThread: MailThread | null
  onSelect: (thread: MailThread) => void
  onRefresh?: () => void
}
