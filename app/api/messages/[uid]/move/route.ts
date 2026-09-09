import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'

interface Params {
  params: Promise<{ uid: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { uid } = await params
  const { folder, targetFolder } = (await req.json().catch(() => ({}))) || {}

  if (
    !/^[1-9]\d*$/.test(uid) ||
    !Number.isSafeInteger(Number(uid)) ||
    typeof folder !== 'string' ||
    !folder ||
    typeof targetFolder !== 'string' ||
    !targetFolder ||
    folder === targetFolder
  ) {
    return NextResponse.json(
      { error: 'folder and targetFolder required' },
      { status: 400 },
    )
  }

  const client = createImapClient(session.email, session.password)

  try {
    await client.connect()
    await client.mailboxOpen(folder)
    const moved = await client.messageMove(uid, targetFolder, { uid: true })
    if (!moved)
      throw new Error(
        'This message could not be moved. Refresh the folder and try again.',
      )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to move message' },
      { status: 500 },
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}
