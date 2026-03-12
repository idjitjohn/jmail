import { NextResponse } from 'next/server'
import { getSession, unauthorized, createSession } from '@/lib/auth'
import { resetPassword } from '@/lib/maddy'
import { createImapClient } from '@/lib/mail'
import { cookies } from 'next/headers'

async function verifyPassword(email: string, password: string): Promise<boolean> {
  const client = createImapClient(email, password)
  try {
    await client.connect()
    await client.logout()
    return true
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const valid = await verifyPassword(session.email, currentPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  await resetPassword(session.email, newPassword)

  // Reissue session with new password
  const token = await createSession({ ...session, password: newPassword })
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
