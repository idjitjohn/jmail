import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData } from '@/lib/userdata'
import { addScheduled } from '@/lib/scheduled'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const fd = await req.formData()
  const to = fd.get('to') as string
  const cc = fd.get('cc') as string
  const subject = fd.get('subject') as string
  const bodyHtml = fd.get('bodyHtml') as string
  const signatureHtml = fd.get('signatureHtml') as string
  const inReplyTo = fd.get('inReplyTo') as string | null
  const scheduleAt = fd.get('scheduleAt') as string
  const attachmentFiles = fd.getAll('attachments').filter((v): v is File => v instanceof File && v.size > 0)

  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 })
  }
  if (!scheduleAt || new Date(scheduleAt) <= new Date()) {
    return NextResponse.json({ error: 'scheduleAt must be in the future' }, { status: 400 })
  }

  const { name } = await getUserData(session.email)

  const attachments = await Promise.all(
    attachmentFiles.map(async f => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()).toString('base64'),
      contentType: f.type || 'application/octet-stream',
    }))
  )

  const id = await addScheduled({
    sendAt: new Date(scheduleAt).toISOString(),
    userEmail: session.email,
    userPassword: session.password,
    name: name ?? undefined,
    to,
    cc,
    subject,
    bodyHtml,
    signatureHtml,
    inReplyTo: inReplyTo || undefined,
    attachments,
  })

  return NextResponse.json({ ok: true, id })
}
