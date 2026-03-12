import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'

const SIEVE_DIR = '/var/lib/maddy/sieve'

function getSievePath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(SIEVE_DIR, `${safe}.sieve`)
  if (!full.startsWith(SIEVE_DIR + '/')) throw new Error('Path traversal')
  return full
}

function isValidEmail(addr: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)
}

async function readForwarding(email: string) {
  try {
    const content = await readFile(getSievePath(email), 'utf-8')
    const match = content.match(/redirect (?::copy )?"([^"]+)"/)
    const keepCopy = content.includes(':copy')
    return { active: true, address: match?.[1] ?? null, keepCopy }
  } catch {
    return { active: false, address: null, keepCopy: true }
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readForwarding(session.email)
  return NextResponse.json(config)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { forwardTo, keepCopy } = await req.json()

  if (!forwardTo || !isValidEmail(forwardTo)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const script = keepCopy
    ? `require ["copy", "redirect"];\nredirect :copy "${forwardTo}";\n`
    : `require ["redirect"];\nredirect "${forwardTo}";\n`

  await writeFile(getSievePath(session.email), script, 'utf-8')

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    await unlink(getSievePath(session.email))
  } catch { /* file not found */ }

  return NextResponse.json({ success: true })
}
