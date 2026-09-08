import type { Contact } from '@/lib/contacts'
import type { MailFolder } from '@/lib/types'
export type WorkspaceTab = 'contacts' | 'scheduled' | 'folders' | 'later'
export type ScheduledItem = {
  id: string
  to: string
  subject: string
  sendAt: string
  status: string
  error?: string
}
export type WorkspaceData = {
  contacts: Contact[]
  folders: MailFolder[]
  scheduled: ScheduledItem[]
}

export type LaterItem = {
  id: string
  subject: string
  dueAt: string
  mode: 'snooze' | 'reminder'
  status: string
  error?: string
  folder: string
  uid: number
}
