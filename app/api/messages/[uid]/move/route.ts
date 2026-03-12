import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

interface Params {
  params: Promise<{ uid: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  const { folder, targetFolder } = await req.json()

  if (!folder || !targetFolder) {
    return NextResponse.json({ error: 'folder and targetFolder required' }, { status: 400 })
  }

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)
    await client.messageMove(`${uid}`, targetFolder, { uid: true })
    await client.logout()

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to move message' },
      { status: 500 }
    )
  }
}
