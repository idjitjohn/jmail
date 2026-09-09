import { NextRequest, NextResponse } from 'next/server'
import { createImapClient } from '@/lib/mail'
import { createSession, extractDomain } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { logLoginFailure, mailAuthenticationError } from '@/lib/mail-errors'
import { sessionRevision } from '@/lib/session-revisions'

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
  let authenticated = false
  try {
    const revision = await sessionRevision(email)
    await client.connect()
    authenticated = true
    const token = await createSession(
      {
        email,
        password: input.password,
        domain: extractDomain(email),
      },
      revision,
    )
    const response = NextResponse.json({ ok: true })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })
    return response
  } catch (error) {
    logLoginFailure(error, authenticated ? 'session' : 'imap')
    if (authenticated)
      return NextResponse.json(
        {
          code: 'SESSION_CONFIGURATION_ERROR',
          error:
            'Your password was accepted, but JMail could not create a session. Please contact your administrator.',
        },
        { status: 503 },
      )
    const failure = mailAuthenticationError(error)
    return NextResponse.json(
      { error: failure.error, code: failure.code },
      { status: failure.status },
    )
  } finally {
    if (authenticated) await client.logout().catch(() => client.close())
    else client.close()
  }
}
