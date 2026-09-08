import { NextRequest, NextResponse } from 'next/server'
import { simpleParser } from 'mailparser'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import { getUserData } from '@/lib/userdata'
import { normalizePreferences } from '@/lib/preferences'
import sanitizeHtml from 'sanitize-html'
import type { MailAttachment } from '@/lib/types'

interface Params {
  params: Promise<{ uid: string }>
}

// GET /api/messages/[uid] — full message content
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  if (!/^[1-9]\d*$/.test(uid))
    return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })
  const folder = new URL(req.url).searchParams.get('folder') || 'INBOX'

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    let message = null

    for await (const msg of client.fetch(
      `${uid}`,
      {
        uid: true,
        flags: true,
        envelope: true,
        source: true,
      },
      { uid: true },
    )) {
      const env = msg.envelope
      if (!env) continue
      const from = env.from?.[0]

      // Parse raw MIME source
      const rawBuf = msg.source ? Buffer.from(msg.source) : Buffer.alloc(0)
      const parsed = rawBuf.length ? await simpleParser(rawBuf) : null
      let html = parsed?.html || undefined
      const text = parsed?.text || undefined

      // Extract attachments metadata
      const attachments: MailAttachment[] = (parsed?.attachments || []).map(
        (att, i) => ({
          filename: att.filename || `attachment-${i + 1}`,
          contentType: att.contentType || 'application/octet-stream',
          size: att.size,
          partId: String(i),
          contentId: att.contentId?.replace(/^<|>$/g, '') || undefined,
          inline: att.contentDisposition === 'inline',
        }),
      )

      // Replace cid: references with data URIs for inline images
      if (html && parsed?.attachments) {
        for (const att of parsed.attachments) {
          if (!att.contentId) continue
          const cid = att.contentId.replace(/^<|>$/g, '')
          const dataUri = `data:${att.contentType};base64,${att.content.toString('base64')}`
          html = html.replaceAll(`cid:${cid}`, dataUri)
        }
      }

      const nonInlineAttachments = attachments.filter((a) => !a.inline)

      const allowImages = req.nextUrl.searchParams.get('images') === 'show'
      const remoteImagesBlocked =
        !allowImages &&
        Boolean(html && /(?:src|url\()\s*=?[\s"']*(?:https?:)?\/\//i.test(html))
      const cleanHtml = html
        ? sanitizeHtml(html, {
            ...SANITIZE_OPTIONS,
            allowedAttributes: {
              ...SANITIZE_OPTIONS.allowedAttributes,
              '*': ['style', 'class', 'align', 'valign', 'width', 'height'],
            img: ['src', 'alt', 'width', 'height'],
            },
            transformTags: {
              ...SANITIZE_OPTIONS.transformTags,
              img: (tagName, attribs) => ({
                tagName,
                attribs:
                  !allowImages && !attribs.src?.startsWith('data:image/')
                    ? { alt: attribs.alt || 'Remote image hidden' }
                    : attribs,
              }),
            },
          })
        : undefined
      message = {
        uid: msg.uid,
        messageId: env.messageId ?? undefined,
        inReplyTo: parsed?.inReplyTo,
        references:
          typeof parsed?.references === 'string'
            ? [parsed.references]
            : parsed?.references || [],
        isDraft: msg.flags?.has('\\Draft') ?? false,
        remoteImagesBlocked,
        bcc: (env.bcc || []).map((a) => ({
          name: a.name,
          address: a.address || '',
        })),
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
        html: cleanHtml,
        text: text || undefined,
        isRead: msg.flags?.has('\\Seen') ?? false,
        isFlagged: msg.flags?.has('\\Flagged') ?? false,
        hasAttachments: nonInlineAttachments.length > 0,
        attachments:
          nonInlineAttachments.length > 0 ? nonInlineAttachments : undefined,
        folder,
      }
    }

    let markReadOnOpen = false
    try {
      markReadOnOpen = normalizePreferences(
        (await getUserData(session.email)).preferences,
      ).markReadOnOpen
    } catch {
      /* Read state preservation */
    }
    // Automatic read preference
    if (message && !message.isDraft && !message.isRead && markReadOnOpen) {
      await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true })
      message.isRead = true
    }

    await client.logout()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch message' },
      { status: 500 },
    )
  }
}

// PATCH /api/messages/[uid] — mark read/unread
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  if (!/^[1-9]\d*$/.test(uid))
    return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })
  const { isRead, isFlagged, folder = 'INBOX' } = await req.json()

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)

    if (typeof isRead === 'boolean') {
      if (isRead) {
        await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true })
      } else {
        await client.messageFlagsRemove(`${uid}`, ['\\Seen'], { uid: true })
      }
    }

    if (typeof isFlagged === 'boolean') {
      if (isFlagged) {
        await client.messageFlagsAdd(`${uid}`, ['\\Flagged'], { uid: true })
      } else {
        await client.messageFlagsRemove(`${uid}`, ['\\Flagged'], { uid: true })
      }
    }

    await client.logout()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update message' },
      { status: 500 },
    )
  }
}

// DELETE /api/messages/[uid] — move to Trash
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  if (!/^[1-9]\d*$/.test(uid))
    return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })
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
      { status: 500 },
    )
  }
}

// Sanitize options — allow safe HTML tags
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'b',
    'blockquote',
    'br',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'div',
    'dl',
    'dt',
    'em',
    'figure',
    'figcaption',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'kbd',
    'li',
    'mark',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    '*': [
      'style',
      'class',
      'align',
      'valign',
      'bgcolor',
      'color',
      'width',
      'height',
    ],
  },
  allowedStyles: {
    '*': Object.fromEntries([
      'color', 'background-color', 'background', 'font-family', 'font-size', 'font-weight', 'font-style',
      'text-align', 'text-decoration', 'line-height', 'letter-spacing', 'border', 'border-top', 'border-bottom',
      'border-left', 'border-right', 'border-color', 'border-width', 'border-style', 'border-collapse', 'border-radius',
      'width', 'max-width', 'min-width', 'height', 'max-height', 'margin', 'margin-top', 'margin-bottom', 'margin-left',
      'margin-right', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'vertical-align',
      'white-space', 'display', 'table-layout',
    ].map(property => [property, [/^(?!.*(?:url|expression|import))[^\\]*$/i]])),
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
}
