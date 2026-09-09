import { NextResponse } from 'next/server'
import { getSession, unauthorized, createSession } from '@/lib/auth'
import { resetPassword } from '@/lib/maddy'
import { createImapClient } from '@/lib/mail'
import { mailAuthenticationError } from '@/lib/mail-errors'
import { cookies } from 'next/headers'
import { stopIdleMonitor } from '@/lib/imap-pool'
import { randomUUID } from 'crypto'
import { revokeSessions } from '@/lib/session-revisions'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const input = await req.json().catch(() => null)
  const { currentPassword, newPassword } = input || {}

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    !currentPassword ||
    !newPassword ||
    currentPassword.length > 1000 ||
    newPassword.length > 1000 ||
    /[\r\n\x00]/.test(newPassword)
  ) {
    return NextResponse.json(
      { error: 'Both passwords are required' },
      { status: 400 },
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    )
  }

  const client = createImapClient(session.email, currentPassword)
  try {
    await client.connect()
  } catch (error) {
    const failure = mailAuthenticationError(error)
    return NextResponse.json(
      { error: failure.error, code: failure.code },
      { status: failure.status },
    )
  } finally {
    client.close()
  }

  let token: string
  const revision = randomUUID()
  try {
    token = await createSession({ ...session, password: newPassword }, revision)
    await revokeSessions(session.email)
  } catch {
    return NextResponse.json(
      {
        code: 'SESSION_CONFIGURATION_ERROR',
        error:
          'JMail could not create a session. Your password has not been changed. Please contact your administrator.',
      },
      { status: 503 },
    )
  }

  try {
    await resetPassword(session.email, newPassword)
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not update the password on the mail server. Please try again.',
      },
      { status: 503 },
    )
  }
  stopIdleMonitor(session.email)
  try {
    await revokeSessions(session.email, revision)
  } catch {
    return NextResponse.json(
      {
        error:
          'Your password was changed. JMail could not finish updating your session. Sign in with your new password.',
      },
      { status: 503 },
    )
  }
  const store = await cookies()
  store.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}
