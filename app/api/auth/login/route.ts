import { NextRequest, NextResponse } from 'next/server'
import { createImapClient } from '@/lib/mail'
import { createSession, extractDomain } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export const POST = async (request: NextRequest) => {
  let input
  try {
    input = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Enter your email and password.' },
      { status: 400 },
    )
  }
  if (
    !input ||
    typeof input.email !== 'string' ||
    typeof input.password !== 'string' ||
    input.email.length > 254 ||
    input.password.length > 1000 ||
    !input.password
  )
    return NextResponse.json(
      { error: 'Enter your email and password.' },
      { status: 400 },
    )
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { error: 'Enter a valid email address.' },
      { status: 400 },
    )
  if (!rateLimit(`login:${email}`, 10, 60000))
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute before trying again.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  const client = createImapClient(email, input.password)
  try {
    await client.connect()
    const token = await createSession({
      email,
      password: input.password,
      domain: extractDomain(email),
    })
    const response = NextResponse.json({ ok: true })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not sign in. Check your credentials or try again shortly.',
      },
      { status: 401 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
