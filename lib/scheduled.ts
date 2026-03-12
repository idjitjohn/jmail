import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const DIR = '/var/lib/maddy'
const FILE = path.join(DIR, 'scheduled.json')

export interface ScheduledAttachment {
  filename: string
  content: string // base64
  contentType: string
}

export interface ScheduledMessage {
  id: string
  sendAt: string // ISO 8601
  userEmail: string
  userPassword: string
  name?: string
  to: string
  cc: string
  subject: string
  bodyHtml: string
  signatureHtml: string
  inReplyTo?: string
  attachments: ScheduledAttachment[]
}

async function readAll(): Promise<ScheduledMessage[]> {
  try {
    const content = await readFile(FILE, 'utf-8')
    return JSON.parse(content) as ScheduledMessage[]
  } catch {
    return []
  }
}

async function writeAll(items: ScheduledMessage[]): Promise<void> {
  try { await mkdir(DIR, { recursive: true }) } catch { /* exists */ }
  await writeFile(FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export async function addScheduled(msg: Omit<ScheduledMessage, 'id'>): Promise<string> {
  const id = crypto.randomUUID()
  const all = await readAll()
  await writeAll([...all, { id, ...msg }])
  return id
}

export async function getDue(): Promise<ScheduledMessage[]> {
  const all = await readAll()
  const now = new Date().toISOString()
  return all.filter(m => m.sendAt <= now)
}

export async function removeScheduled(id: string): Promise<void> {
  const all = await readAll()
  await writeAll(all.filter(m => m.id !== id))
}
