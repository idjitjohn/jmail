import { appendFile } from 'fs/promises'
import { getSession } from './auth'
import { NextResponse } from 'next/server'

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
    await appendFile('/var/log/maddy/admin.log', line)
  } catch {
    // fallback to stdout if log file not writable
    console.log('[admin]', line.trim())
  }
}

export const DOMAINS = [
  'marson-dev.com',
  'atydago.com',
  'ariari.mg',
  'fiharysoft.com',
  'iza-ary.mg',
  'atrnai.com',
  'mcore.mg',
]
