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
        specialUse: mailbox.specialUse,
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
      { status: 500 },
    )
  }
}

const mutateFolder = async (
  request: Request,
  method: 'create' | 'rename' | 'delete',
) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const client = createImapClient(session.email, session.password)
  try {
    const input = await request.json()
    const valid = (name: unknown): name is string =>
      typeof name === 'string' &&
      Boolean(name.trim()) &&
      name.length <= 160 &&
      !/[\x00-\x1f\x7f]/.test(name)
    if (!valid(input.name) || (method === 'rename' && !valid(input.newName)))
      throw new Error('Enter a valid folder name.')
    await client.connect()
    const folders = await client.list()
    const folder = folders.find((folder) => folder.path === input.name)
    if (method !== 'create') {
      if (!folder) throw new Error('Folder not found.')
      if (
        folder.specialUse ||
        /^(inbox|sent|drafts|trash|spam|junk|archive)$/i.test(folder.path)
      )
        throw new Error('Built-in mail folders cannot be renamed or deleted.')
    }
    if (method === 'create') await client.mailboxCreate(input.name.trim())
    if (method === 'rename')
      await client.mailboxRename(input.name, input.newName.trim())
    if (method === 'delete') {
      const status = await client.status(input.name, { messages: true })
      if (
        status.messages ||
        folders.some((item) =>
          item.path.startsWith(`${input.name}${folder?.delimiter || '/'}`),
        )
      )
        throw new Error(
          'Move all messages and subfolders before deleting this folder.',
        )
      await client.mailboxDelete(input.name)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not update this folder.',
      },
      { status: 400 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
export const POST = (request: Request) => mutateFolder(request, 'create')
export const PATCH = (request: Request) => mutateFolder(request, 'rename')
export const DELETE = (request: Request) => mutateFolder(request, 'delete')
