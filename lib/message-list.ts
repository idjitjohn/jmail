import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from './auth'
import { createImapClient } from './mail'
import {
  buildMailSearch,
  hasMailAttachments,
  type MailFilter,
} from './mail-search'
import type { MailMessage } from './types'

export const listMessages = async (request: NextRequest) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const params = request.nextUrl.searchParams
  const page = Number(params.get('page') || 1)
  const filter = params.get('filter') || 'all'
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 200 ||
    !['all', 'unread', 'starred'].includes(filter)
  )
    return NextResponse.json({ error: 'Invalid search.' }, { status: 400 })
  const client = createImapClient(session.email, session.password)
  try {
    const query = buildMailSearch(
      params.get('q') || '',
      filter as MailFilter,
      Object.fromEntries(
        ['from', 'to', 'subject', 'after', 'before'].map((key) => [
          key,
          params.get(key) || '',
        ]),
      ),
    )
    await client.connect()
    const folders =
      params.get('scope') === 'all'
        ? (await client.list())
            .filter((folder) => !folder.flags.has('\\Noselect'))
            .map((folder) => folder.path)
        : [params.get('folder') || 'INBOX']
    const messages: MailMessage[] = []
    let total = 0
    for (const folder of folders) {
      await client.mailboxOpen(folder)
      const found = await client.search(query, { uid: true })
      const uids = Array.isArray(found) ? found : []
      total += uids.length
      const pageUids = uids.slice(-page * 50)
      if (!pageUids.length) continue
      for await (const message of client.fetch(
        pageUids.join(','),
        {
          uid: true,
          flags: true,
          envelope: true,
          headers: ['references'],
          bodyParts: [{ key: '1', maxLength: 1024 }],
          bodyStructure: true,
          size: true,
        },
        { uid: true },
      )) {
        const env = message.envelope
        if (!env) continue
        const header =
          message.headers?.toString('utf8').replace(/\r?\n\s+/g, ' ') || ''
        const references = header.match(/<[^<>\s]+>/g) || []
        messages.push({
          uid: message.uid,
          messageId: env.messageId,
          inReplyTo: env.inReplyTo,
          references,
          preview: message.bodyParts
            ?.get('1')
            ?.toString('utf8')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&[a-z]+;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120),
          subject: env.subject || '',
          from: {
            name: env.from?.[0]?.name,
            address: env.from?.[0]?.address || '',
          },
          to: (env.to || []).map((item) => ({
            name: item.name,
            address: item.address || '',
          })),
          cc: (env.cc || []).map((item) => ({
            name: item.name,
            address: item.address || '',
          })),
          date: (env.date || new Date(0)).toISOString(),
          isRead: message.flags?.has('\\Seen') || false,
          isFlagged: message.flags?.has('\\Flagged') || false,
          isDraft: message.flags?.has('\\Draft') || false,
          hasAttachments: hasMailAttachments(message.bodyStructure),
          folder,
          size: message.size,
        })
      }
    }
    messages.sort((a, b) => b.date.localeCompare(a.date) || b.uid - a.uid)
    return NextResponse.json({
      messages: messages.slice((page - 1) * 50, page * 50),
      total,
      hasMore: total > page * 50,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not load messages.',
      },
      { status: 400 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
