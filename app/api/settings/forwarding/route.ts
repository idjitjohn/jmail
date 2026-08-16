import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, trySaveSieveConfig } from '@/lib/sieve'

function isValidEmail(addr: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)
}

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readSieveConfig(session.email)
  const fwd = config.forwarding
  return NextResponse.json({
    active: !!fwd,
    address: fwd?.address ?? null,
    keepCopy: fwd?.keepCopy ?? true,
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { forwardTo, keepCopy } = await req.json()

  if (!forwardTo || !isValidEmail(forwardTo)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const config = await readSieveConfig(session.email)
  const saveError = await trySaveSieveConfig(session.email, {
    ...config,
    forwarding: { address: forwardTo, keepCopy: !!keepCopy },
  })

  if (saveError) return NextResponse.json({ error: saveError }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readSieveConfig(session.email)
  const saveError = await trySaveSieveConfig(session.email, { ...config, forwarding: null })

  if (saveError) return NextResponse.json({ error: saveError }, { status: 500 })

  return NextResponse.json({ ok: true })
}
