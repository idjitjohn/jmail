import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

export const POST = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const client = createImapClient(session.email, session.password)
  try {
    const { messages, action, destination } = await request.json()
    if (
      !Array.isArray(messages) ||
      !messages.length ||
      messages.length > 500 ||
      messages.some(
        (item) =>
          !Number.isSafeInteger(item.uid) ||
          item.uid < 1 ||
          typeof item.folder !== 'string' ||
          !item.folder,
      )
    )
      throw new Error('Select between 1 and 500 messages.')
    if (
      ![
        'read',
        'unread',
        'star',
        'unstar',
        'archive',
        'trash',
        'move',
      ].includes(action)
    )
      throw new Error('Unknown mail action.')
    if (action === 'move' && (typeof destination !== 'string' || !destination))
      throw new Error('Choose a destination folder.')
    await client.connect()
    const folders = await client.list()
    let target = destination
    if (action === 'archive' || action === 'trash') {
      const special = action === 'archive' ? '\\Archive' : '\\Trash'
      target =
        folders.find((folder) => folder.specialUse === special)?.path ||
        (action === 'archive' ? 'Archive' : 'Trash')
      if (!folders.some((folder) => folder.path === target))
        await client.mailboxCreate(target)
    } else if (
      action === 'move' &&
      !folders.some(
        (folder) => folder.path === target && !folder.flags.has('\\Noselect'),
      )
    )
      throw new Error('Destination folder not found.')
    for (const folder of [
      ...new Set<string>(messages.map((item) => item.folder)),
    ]) {
      const lock = await client.getMailboxLock(folder)
      try {
        const uids = [
          ...new Set(
            messages
              .filter((item) => item.folder === folder)
              .map((item) => item.uid),
          ),
        ].join(',')
        if (action === 'read' || action === 'star')
          await client.messageFlagsAdd(
            uids,
            [action === 'read' ? '\\Seen' : '\\Flagged'],
            { uid: true },
          )
        else if (action === 'unread' || action === 'unstar')
          await client.messageFlagsRemove(
            uids,
            [action === 'unread' ? '\\Seen' : '\\Flagged'],
            { uid: true },
          )
        else if (target !== folder)
          await client.messageMove(uids, target, { uid: true })
      } finally {
        lock.release()
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Some messages could not be updated. Refresh before trying again.',
      },
      { status: 400 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
