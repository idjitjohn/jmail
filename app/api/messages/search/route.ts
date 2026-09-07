import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import type { MailMessage } from '@/lib/types'
import {
  buildMailSearch,
  hasMailAttachments,
  type MailFilter,
} from '@/lib/mail-search'

const MAX_RESULTS = 50

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim() || ''
  const filter = searchParams.get('filter') || 'all'
  const page = Number(searchParams.get('page') || '1')
  const folder = searchParams.get('folder') || 'INBOX'

  if (
    !['all', 'unread', 'starred'].includes(filter) ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return NextResponse.json(
      { error: 'Invalid filter or page' },
      { status: 400 },
    )
  }

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    const result = await client.search(
      buildMailSearch(query, filter as MailFilter),
      { uid: true },
    )

    const uids = Array.isArray(result) ? result : []

    if (!uids.length) {
      return NextResponse.json({ messages: [], total: 0, hasMore: false })
    }

    const end = Math.max(0, uids.length - (page - 1) * MAX_RESULTS)
    const sliced = uids.slice(Math.max(0, end - MAX_RESULTS), end).reverse()
    if (!sliced.length) {
      return NextResponse.json({
        messages: [],
        total: uids.length,
        hasMore: false,
      })
    }
    const uidRange = sliced.join(',')

    const messages: MailMessage[] = []

    for await (const msg of client.fetch(
      uidRange,
      {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        bodyParts: ['1'],
        size: true,
      },
      { uid: true },
    )) {
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
        to: (env.to || []).map((a) => ({
          name: a.name || undefined,
          address: a.address || '',
        })),
        date: (env.date ?? new Date()).toISOString(),
        preview,
        isRead: msg.flags?.has('\\Seen') ?? false,
        isFlagged: msg.flags?.has('\\Flagged') ?? false,
        hasAttachments: hasMailAttachments(msg.bodyStructure),
        folder,
        size: msg.size,
      })
    }

    // Sort newest first
    messages.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    return NextResponse.json({
      messages,
      total: uids.length,
      hasMore: uids.length > page * MAX_RESULTS,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Search failed' },
      { status: 500 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
