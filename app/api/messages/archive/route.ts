import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

export const POST = async (request: Request) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const payload = await request.json().catch(() => null)
  if (
    typeof payload?.folder !== 'string' ||
    !payload.folder ||
    !Array.isArray(payload.uids) ||
    !payload.uids.length ||
    payload.uids.length > 500 ||
    !payload.uids.every(
      (uid: unknown) => Number.isSafeInteger(uid) && Number(uid) > 0,
    )
  ) {
    return NextResponse.json(
      { error: 'Choose messages to archive.' },
      { status: 400 },
    )
  }
  const client = createImapClient(session.email, session.password)
  try {
    await client.connect()
    const folders = await client.list()
    const archive =
      folders.find((folder) => folder.specialUse === '\\Archive')?.path ??
      folders.find((folder) => folder.path.toLowerCase() === 'archive')?.path ??
      'Archive'
    if (payload.folder === archive) return NextResponse.json({ ok: true })
    if (!folders.some((folder) => folder.path === archive))
      await client.mailboxCreate(archive)
    await client.mailboxOpen(payload.folder)
    const result = await client.messageMove(payload.uids.join(','), archive, {
      uid: true,
    })
    if (!result) throw new Error('Archive failed')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not archive this conversation. Please try again.' },
      { status: 500 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
