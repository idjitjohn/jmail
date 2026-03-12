import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import type { MailMessage } from '@/lib/types'

const MAX_RESULTS = 50

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const folder = searchParams.get('folder') || 'INBOX'

  if (!query) {
    return NextResponse.json({ messages: [] })
  }

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    // IMAP OR search across subject, from, to, and body
    const result = await client.search({
      or: [
        { subject: query },
        { from: query },
        { to: query },
        { body: query },
      ],
    }, { uid: true })

    const uids = Array.isArray(result) ? result : []

    if (!uids.length) {
      await client.logout()
      return NextResponse.json({ messages: [] })
    }

    // Take latest N results
    const sliced = uids.slice(-MAX_RESULTS).reverse()
    const uidRange = sliced.join(',')

    const messages: MailMessage[] = []

    for await (const msg of client.fetch(uidRange, {
      uid: true,
      flags: true,
      envelope: true,
      bodyStructure: true,
      bodyParts: ['1'],
      size: true,
    }, { uid: true })) {
      const env = msg.envelope
      if (!env) continue
      const from = env.from?.[0]

      let preview = ''
      const part = msg.bodyParts?.get('1')
      if (part) {
        const raw = Buffer.from(part).toString('utf-8')
        const stripped = raw.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
        preview = stripped.replace(/\s+/g, ' ').trim().slice(0, 120)
      }

      messages.push({
        uid: msg.uid,
        messageId: env.messageId ?? undefined,
        inReplyTo: env.inReplyTo ?? undefined,
        subject: env.subject || '',
        from: {
          name: from?.name || undefined,
          address: from?.address || '',
        },
        to: (env.to || []).map(a => ({ name: a.name || undefined, address: a.address || '' })),
        date: (env.date ?? new Date()).toISOString(),
        preview,
        isRead: msg.flags?.has('\\Seen') ?? false,
        isFlagged: msg.flags?.has('\\Flagged') ?? false,
        hasAttachments: false,
        folder,
        size: msg.size,
      })
    }

    // Sort newest first
    messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    await client.logout()

    return NextResponse.json({ messages })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Search failed' },
      { status: 500 }
    )
  }
}
