import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import type { MailFolder } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()

    const mailboxList = await client.list()
    const folders: MailFolder[] = []

    for (const mailbox of mailboxList) {
      if (mailbox.flags.has('\\Noselect')) continue

      let unread = 0
      try {
        const status = await client.status(mailbox.path, { unseen: true })
        unread = status.unseen ?? 0
      } catch {
        // folder may not support STATUS
      }

      folders.push({
        name: mailbox.name,
        path: mailbox.path,
        unread,
        delimiter: mailbox.delimiter ?? undefined,
      })
    }

    await client.logout()

    const ORDER = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Archive']
    folders.sort((a, b) => {
      const ai = ORDER.indexOf(a.path)
      const bi = ORDER.indexOf(b.path)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(folders)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list folders' },
      { status: 500 }
    )
  }
}
