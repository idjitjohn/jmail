import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import sanitizeHtml from 'sanitize-html'

interface Params {
  params: Promise<{ uid: string }>
}

// GET /api/messages/[uid] — full message content
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  const folder = new URL(req.url).searchParams.get('folder') || 'INBOX'

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    let message = null

    for await (const msg of client.fetch(`${uid}`, {
      uid: true,
      flags: true,
      envelope: true,
      source: true,
    }, { uid: true })) {
      const env = msg.envelope
      if (!env) continue
      const from = env.from?.[0]

      // Parse raw source to extract HTML/text
      const raw = msg.source ? Buffer.from(msg.source).toString('utf-8') : ''
      const { html, text } = parseBody(raw)

      message = {
        uid: msg.uid,
        messageId: env.messageId ?? undefined,
        subject: env.subject || '',
        from: {
          name: from?.name || undefined,
          address: from?.address || '',
        },
        to: (env.to || []).map((a: { name?: string; address?: string }) => ({
          name: a.name || undefined,
          address: a.address || '',
        })),
        cc: (env.cc || []).map((a: { name?: string; address?: string }) => ({
          name: a.name || undefined,
          address: a.address || '',
        })),
        date: (env.date ?? new Date()).toISOString(),
        html: html ? sanitizeHtml(html, SANITIZE_OPTIONS) : undefined,
        text: text || undefined,
        isRead: msg.flags?.has('\\Seen') ?? false,
        hasAttachments: false,
        folder,
      }
    }

    // Mark as read
    if (message && !message.isRead) {
      await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true })
    }

    await client.logout()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch message' },
      { status: 500 }
    )
  }
}

// PATCH /api/messages/[uid] — mark read/unread
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  const { isRead, folder = 'INBOX' } = await req.json()

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    if (isRead) {
      await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true })
    } else {
      await client.messageFlagsRemove(`${uid}`, ['\\Seen'], { uid: true })
    }

    await client.logout()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE /api/messages/[uid] — move to Trash
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  const folder = new URL(req.url).searchParams.get('folder') || 'INBOX'

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    if (folder === 'Trash') {
      // Permanently delete if already in Trash
      await client.messageDelete(`${uid}`, { uid: true })
    } else {
      await client.messageMove(`${uid}`, 'Trash', { uid: true })
    }

    await client.logout()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete message' },
      { status: 500 }
    )
  }
}

// Sanitize options — allow safe HTML tags
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup',
    'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figure', 'figcaption',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li',
    'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'summary',
    'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
  ],
  allowedAttributes: {
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'style'],
    '*': ['style', 'class', 'align', 'valign', 'bgcolor', 'color', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'cid'],
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
}

// Basic MIME body parser — extracts HTML and text parts
function parseBody(raw: string): { html?: string; text?: string } {
  const htmlMatch = raw.match(/Content-Type: text\/html[^\n]*\n(?:[^\n]+\n)*?\n([\s\S]+?)(?=--|\z)/i)
  const textMatch = raw.match(/Content-Type: text\/plain[^\n]*\n(?:[^\n]+\n)*?\n([\s\S]+?)(?=--|\z)/i)

  return {
    html: htmlMatch?.[1]?.trim(),
    text: textMatch?.[1]?.trim(),
  }
}
