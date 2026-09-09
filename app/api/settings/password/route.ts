import { NextResponse } from 'next/server'
import { getSession, unauthorized, createSession } from '@/lib/auth'
import { resetPassword } from '@/lib/maddy'
import { createImapClient } from '@/lib/mail'
import { mailAuthenticationError } from '@/lib/mail-errors'
import { setAuthCookies } from '@/lib/auth-cookies'
import type { AuthTokens } from '@/lib/auth'
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

  let tokens: AuthTokens | null
  const revision = randomUUID()
  try {
    tokens = await createSession(
      { ...session, password: newPassword },
      revision,
    )
    if (!tokens) throw new Error('Could not create a session')
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
  return setAuthCookies(
    NextResponse.json({
      ok: true,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    }),
    tokens,
  )
}
