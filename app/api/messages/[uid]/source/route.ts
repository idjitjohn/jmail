import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const { uid } = await params
  if (!/^[1-9]\d*$/.test(uid))
    return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })
  const client = createImapClient(session.email, session.password)
  try {
    await client.connect()
    await client.mailboxOpen(req.nextUrl.searchParams.get('folder') || 'INBOX')
    const message = await client.fetchOne(uid, { source: true }, { uid: true })
    if (!message || !message.source)
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
    return new NextResponse(new Uint8Array(message.source), {
      headers: {
        'Content-Type': 'message/rfc822',
        'Content-Disposition': `attachment; filename="message-${uid}.eml"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not export this message.' },
      { status: 500 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
