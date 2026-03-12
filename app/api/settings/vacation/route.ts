import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, writeSieveConfig } from '@/lib/sieve'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readSieveConfig(session.email)
  return NextResponse.json(config.vacation ?? { subject: '', message: '', days: 7 })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { subject, message, days } = await req.json()

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  const config = await readSieveConfig(session.email)
  await writeSieveConfig(session.email, {
    ...config,
    vacation: { subject: subject.trim(), message: message.trim(), days: days ?? 7 },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return unauthorized()

  const config = await readSieveConfig(session.email)
  await writeSieveConfig(session.email, { ...config, vacation: null })

  return NextResponse.json({ ok: true })
}
