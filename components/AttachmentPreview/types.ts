import type { MailAttachment } from '@/lib/types'
export type PreviewFile = MailAttachment & { uid: number; folder: string }
