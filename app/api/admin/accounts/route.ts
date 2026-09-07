import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction } from '@/lib/admin'
import { getManagedDomains } from '@/lib/maddy-admin'
import { listAccounts, createAccount } from '@/lib/maddy'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  try {
    const accounts = await listAccounts()
    return NextResponse.json(accounts)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list accounts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()

  const { email, password } = await req.json()

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
    const domains = await getManagedDomains()
    if (!domains.includes(email.split('@')[1])) {
      return NextResponse.json({ error: 'Domain is not managed by Maddy' }, { status: 400 })
    }
    await createAccount(email, password)
    await logAdminAction('CREATE_ACCOUNT', `${email} by ${session.email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create account' },
      { status: 500 }
    )
  }
}
