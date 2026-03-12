import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { folder = 'INBOX' } = await req.json()

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    const mailbox = await client.mailboxOpen(folder)

    if (mailbox.exists && mailbox.exists > 0) {
      await client.messageFlagsAdd('1:*', ['\\Seen'])
    }

    await client.logout()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
