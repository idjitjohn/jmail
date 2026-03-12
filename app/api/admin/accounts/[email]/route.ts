import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction } from '@/lib/admin'
import { deleteAccount, resetPassword } from '@/lib/maddy'

interface Params {
  params: Promise<{ email: string }>
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  const { email } = await params
  const decoded = decodeURIComponent(email)

  try {
    await deleteAccount(decoded)
    await logAdminAction('DELETE_ACCOUNT', `${decoded} by ${session.email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  const { email } = await params
  const decoded = decodeURIComponent(email)
  const { password } = await req.json()

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
    await resetPassword(decoded, password)
    await logAdminAction('RESET_PASSWORD', `${decoded} by ${session.email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to reset password' },
      { status: 500 }
    )
  }
}
