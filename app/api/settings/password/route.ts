import { NextResponse } from 'next/server'
import { getSession, unauthorized, createSession } from '@/lib/auth'
import { resetPassword } from '@/lib/maddy'
import { createImapClient } from '@/lib/mail'
import { mailAuthenticationError } from '@/lib/mail-errors'
import { cookies } from 'next/headers'

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
    newPassword.length > 1000
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
  try {
    token = await createSession({ ...session, password: newPassword })
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

  await resetPassword(session.email, newPassword)
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
