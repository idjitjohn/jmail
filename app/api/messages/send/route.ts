import { NextRequest, NextResponse } from 'next/server'
import MailComposer from 'nodemailer/lib/mail-composer'
import { getSession, unauthorized } from '@/lib/auth'
import { createSmtpTransport, createImapClient } from '@/lib/mail'
import { getUserData } from '@/lib/userdata'

function buildRaw(opts: ConstructorParameters<typeof MailComposer>[0]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new MailComposer(opts).compile().build((err, buf) => err ? reject(err) : resolve(buf))
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { to, cc, subject, body, inReplyTo } = await req.json()

  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 })
  }

  const { name } = await getUserData(session.email)
  const from = name?.trim()
    ? `"${name.trim()}" <${session.email}>`
    : session.email

  const mailOpts = {
    from,
    to,
    cc: cc || undefined,
    subject,
    text: body,
    html: body ? `<pre style="font-family:inherit;white-space:pre-wrap">${body}</pre>` : undefined,
    inReplyTo: inReplyTo || undefined,
    references: inReplyTo || undefined,
  }

  const transport = createSmtpTransport(session.email, session.password)

  try {
    // Build raw message once — used for both sending and IMAP append
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
