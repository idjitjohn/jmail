import { NextRequest, NextResponse } from 'next/server'
import MailComposer from 'nodemailer/lib/mail-composer'
import { getSession, unauthorized } from '@/lib/auth'
import { createSmtpTransport, createImapClient } from '@/lib/mail'
import { getUserData } from '@/lib/userdata'
import { htmlToText } from '@/lib/format'

function buildRaw(opts: ConstructorParameters<typeof MailComposer>[0]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new MailComposer(opts).compile().build((err, buf) => err ? reject(err) : resolve(buf))
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const fd = await req.formData()
  const to = fd.get('to') as string
  const cc = fd.get('cc') as string
  const subject = fd.get('subject') as string
  const bodyHtml = fd.get('bodyHtml') as string
  const signatureHtml = fd.get('signatureHtml') as string | null
  const inReplyTo = fd.get('inReplyTo') as string | null
  const attachmentFiles = fd.getAll('attachments').filter((v): v is File => v instanceof File && v.size > 0)

  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 })
  }

  const { name } = await getUserData(session.email)
  const from = name?.trim()
    ? `"${name.trim()}" <${session.email}>`
    : session.email

  const attachments = await Promise.all(
    attachmentFiles.map(async f => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
      contentType: f.type || 'application/octet-stream',
    }))
  )

  const fullHtml = [
    bodyHtml,
    signatureHtml ? `<div class="signature" style="margin-top:1.5em;padding-top:1em;border-top:1px solid #e5e5ea">${signatureHtml}</div>` : '',
  ].filter(Boolean).join('\n') || undefined

  const mailOpts = {
    from,
    to,
    cc: cc || undefined,
    subject,
    text: htmlToText(bodyHtml || ''),
    html: fullHtml,
    attachments,
    inReplyTo: inReplyTo || undefined,
    references: inReplyTo || undefined,
  }

  const transport = createSmtpTransport(session.email, session.password)

  try {
    const raw = await buildRaw(mailOpts)

    await transport.sendMail({
      envelope: { from: session.email, to: [to, ...(cc ? cc.split(',').map((s: string) => s.trim()) : [])] },
      raw,
    })

    // Append copy to Sent folder (non-fatal)
    const imap = createImapClient(session.email, session.password)
    try {
      await imap.connect()
      for (const folder of ['Sent', 'INBOX.Sent', 'Sent Messages']) {
        try { await imap.append(folder, raw, ['\\Seen']); break } catch { /* try next */ }
      }
    } catch { /* non-fatal */ } finally {
      try { await imap.logout() } catch { /* ignore */ }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
