import { NextRequest, NextResponse } from 'next/server'
import { simpleParser } from 'mailparser'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

interface Params {
  params: Promise<{ uid: string; partId: string }>
}

// GET /api/messages/[uid]/attachments/[partId] — download attachment
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid, partId } = await params
  const folder = new URL(req.url).searchParams.get('folder') || 'INBOX'
  const idx = parseInt(partId)

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    let attachment = null

    for await (const msg of client.fetch(`${uid}`, {
      uid: true,
      source: true,
    }, { uid: true })) {
      const rawBuf = msg.source ? Buffer.from(msg.source) : Buffer.alloc(0)
      if (!rawBuf.length) continue
      const parsed = await simpleParser(rawBuf)
      const att = parsed.attachments?.[idx]
      if (att) attachment = att
    }

    await client.logout()

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(attachment.content), {
      headers: {
        'Content-Type': attachment.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename || 'download')}"`,
        'Content-Length': String(attachment.size),
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to download attachment' },
      { status: 500 }
    )
  }
}
