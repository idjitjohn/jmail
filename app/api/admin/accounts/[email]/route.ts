import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction } from '@/lib/admin'
import { deleteAccount, resetPassword } from '@/lib/maddy'
import { stopIdleMonitor } from '@/lib/imap-pool'
import { revokeSessions } from '@/lib/session-revisions'

type Params = {
  params: Promise<{ email: string }>
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  const { email } = await params
  const decoded = email
  if (decoded.toLowerCase() === session.email.toLowerCase())
    return NextResponse.json(
      {
        error:
          'You cannot delete the administrator account you are signed in with.',
      },
      { status: 400 },
    )

  try {
    await revokeSessions(decoded)
    await deleteAccount(decoded)
    await revokeSessions(decoded)
    stopIdleMonitor(decoded)
    await logAdminAction('DELETE_ACCOUNT', `${decoded} by ${session.email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete account' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  const { email } = await params
  const decoded = email
  const { password } = (await req.json().catch(() => ({}))) || {}
  if (decoded.toLowerCase() === session.email.toLowerCase())
    return NextResponse.json(
      {
        error:
          'Use your account password settings to change your own password.',
      },
      { status: 400 },
    )

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 1000 ||
    /[\r\n\x00]/.test(password)
  ) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    )
  }

  try {
    await revokeSessions(decoded)
    await resetPassword(decoded, password)
    await revokeSessions(decoded)
    stopIdleMonitor(decoded)
    await logAdminAction('RESET_PASSWORD', `${decoded} by ${session.email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to reset password' },
      { status: 500 },
    )
  }
}
