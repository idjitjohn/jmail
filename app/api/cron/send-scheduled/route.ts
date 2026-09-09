import path from 'path'
import { withFileLock, writeJson } from '@/lib/file-store'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { claimDue, finishScheduled } from '@/lib/scheduled'
import { processLater } from '@/lib/mail-later'
import { deliverMessage } from '@/lib/outgoing'

const heartbeat = path.resolve(
  process.env.JMAIL_WORKER_STATUS_FILE || '/var/lib/maddy/jmail/worker.json',
)

export const GET = async (req: NextRequest) => {
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer /, '') || ''
  const expected = process.env.CRON_SECRET || ''
  if (
    !expected ||
    Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const due = await claimDue()
  const results = []
  for (const message of due) {
    try {
      const result = await deliverMessage(
        {
          email: message.userEmail,
          password: message.userPassword,
          name: message.name,
          domain: message.userEmail.split('@')[1],
        },
        message,
      )
      await finishScheduled(
        message.id,
        result.rejected.length
          ? `Some recipients were rejected: ${result.rejected.join(', ')}. Other recipients may have received this message.`
          : undefined,
      )
      results.push({ id: message.id, ok: !result.rejected.length })
    } catch {
      await finishScheduled(
        message.id,
        'Delivery could not be confirmed. Check Sent and the recipient before trying again.',
      )
      results.push({ id: message.id, ok: false })
    }
  }
  const reminders = await processLater()
  await withFileLock(heartbeat, () =>
    writeJson(heartbeat, { lastRun: new Date().toISOString() }),
  )
  return NextResponse.json({ processed: results.length, reminders, results })
}
