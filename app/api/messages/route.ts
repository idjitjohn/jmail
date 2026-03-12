import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import type { MailMessage } from '@/lib/types'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder') || 'INBOX'
  const page = parseInt(searchParams.get('page') || '1')

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    const status = await client.status(folder, { messages: true, unseen: true })
    const total = status.messages ?? 0

    const messages: MailMessage[] = []

    if (total > 0) {
      // Fetch newest first: last PAGE_SIZE UIDs descending
      const end = Math.max(1, total - (page - 1) * PAGE_SIZE)
      const start = Math.max(1, end - PAGE_SIZE + 1)
      const range = `${start}:${end}`

      for await (const msg of client.fetch(range, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        bodyParts: ['1'],
        size: true,
      })) {
        const env = msg.envelope
        if (!env) continue
        const from = env.from?.[0]

        // plain text preview from body part 1
        let preview = ''
        const part = msg.bodyParts?.get('1')
        if (part) {
          preview = Buffer.from(part).toString('utf-8').slice(0, 120).replace(/\s+/g, ' ')
        }

        messages.push({
          uid: msg.uid,
          messageId: env.messageId ?? undefined,
          subject: env.subject || '',
          from: {
            name: from?.name || undefined,
            address: from?.address || '',
          },
          to: (env.to || []).map(a => ({ name: a.name || undefined, address: a.address || '' })),
          date: (env.date ?? new Date()).toISOString(),
          preview,
          isRead: msg.flags?.has('\\Seen') ?? false,
          hasAttachments: false,
          folder,
          size: msg.size,
        })
      }

      // Reverse so newest is first
      messages.reverse()
    }

    await client.logout()

    const hasMore = total > page * PAGE_SIZE

    return NextResponse.json({ messages, hasMore, total })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
