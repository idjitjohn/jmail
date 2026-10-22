import { appendFile } from 'fs/promises'
import { getSession } from './auth'
import { NextResponse } from 'next/server'
import { ADMIN_LOG_FILE } from './data-paths'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function getAdminSession() {
  const session = await getSession()
  if (!session) return null
  if (session.email !== ADMIN_EMAIL) return null
  return session
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function logAdminAction(action: string, details: string): Promise<void> {
  const line = `[${new Date().toISOString()}] ${action}: ${details}\n`
  try {
    await appendFile(ADMIN_LOG_FILE, line)
  } catch {
    // fallback to stdout if log file not writable
    console.log('[admin]', line.trim())
  }
}
