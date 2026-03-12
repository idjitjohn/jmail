import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction, DOMAINS } from '@/lib/admin'
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

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const domain = email.split('@')[1]
  if (!DOMAINS.includes(domain)) {
    return NextResponse.json({ error: `Domain ${domain} is not managed` }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
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
