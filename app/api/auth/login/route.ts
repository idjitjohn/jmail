import { NextRequest, NextResponse } from 'next/server'
import { createImapClient } from '@/lib/mail'
import { createSession, extractDomain } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const client = createImapClient(email, password)

  try {
    await client.connect()
    await client.logout()
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createSession({
    email,
    password,
    domain: extractDomain(email),
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return res
}
