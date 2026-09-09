import path from 'path'
import { createHash } from 'crypto'
import { withFileLock } from '@/lib/file-store'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createImapClient } from '@/lib/mail'
import { buildMessage, readOutgoing } from '@/lib/outgoing'

const updateDraft = async (req: NextRequest, remove: boolean) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const client = createImapClient(session.email, session.password)
  const lockPath = path.join(
    process.env.JMAIL_USERDATA_DIR || '/var/lib/maddy/userdata',
    '.locks',
    createHash('sha256').update(session.email).digest('hex'),
  )
  return withFileLock(lockPath, async () => {
    try {
      const fd = await req.formData()
      const rawUid = fd.get('uid')
      const uid = rawUid ? Number(rawUid) : undefined
      if (uid !== undefined && (!Number.isSafeInteger(uid) || uid < 1))
        throw new Error('Invalid draft.')
      const message = remove ? null : await readOutgoing(fd)
      await client.connect()
      const folders = await client.list()
      const folder =
        folders.find((item) => item.specialUse === '\\Drafts')?.path || 'Drafts'
      if (!folders.some((item) => item.path === folder))
        await client.mailboxCreate(folder)
      const lock = await client.getMailboxLock(folder)
      try {
        if (uid) {
          const previous = await client.fetchOne(
            String(uid),
            { flags: true },
            { uid: true },
          )
          if (!previous || !previous.flags?.has('\\Draft'))
            throw new Error(
              'This draft was changed or removed. Reopen it before saving.',
            )
        }
        if (remove) {
          if (uid) await client.messageDelete(String(uid), { uid: true })
          return NextResponse.json({ ok: true })
        }
        const raw = await buildMessage(
          message!,
          session.email,
          session.name,
          true,
        )
        const added = await client.append(folder, raw, ['\\Draft', '\\Seen'])
        if (!added || !added.uid)
          throw new Error(
            'This server did not confirm the saved draft. Check Drafts before saving again.',
          )
        if (uid) await client.messageDelete(String(uid), { uid: true })
        return NextResponse.json({ uid: added.uid, folder })
      } finally {
        lock.release()
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not save your draft.',
        },
        { status: 400 },
      )
    } finally {
      await client.logout().catch(() => client.close())
    }
  })
}
export const PUT = (req: NextRequest) => updateDraft(req, false)
export const DELETE = (req: NextRequest) => updateDraft(req, true)
