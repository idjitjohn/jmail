import { NextRequest, NextResponse } from 'next/server'
import MailComposer from 'nodemailer/lib/mail-composer'
import { getDue, removeScheduled } from '@/lib/scheduled'
import { createSmtpTransport, createImapClient } from '@/lib/mail'
import { htmlToText } from '@/lib/format'

// Protect with CRON_SECRET env var
// Call via: GET /api/cron/send-scheduled?secret=<CRON_SECRET>
// Add to crontab: */5 * * * * curl "http://localhost:3000/api/cron/send-scheduled?secret=..."

function buildRaw(opts: ConstructorParameters<typeof MailComposer>[0]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new MailComposer(opts).compile().build((err, buf) => err ? reject(err) : resolve(buf))
  })
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await getDue()
  const results: { id: string; ok: boolean; error?: string }[] = []

  for (const msg of due) {
    try {
      const from = msg.name
        ? `"${msg.name}" <${msg.userEmail}>`
        : msg.userEmail

      const attachments = msg.attachments.map(a => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
        contentType: a.contentType,
        encoding: 'base64' as const,
      }))

      const fullHtml = [
        msg.bodyHtml,
        msg.signatureHtml ? `<div class="signature" style="margin-top:1.5em;padding-top:1em;border-top:1px solid #e5e5ea">${msg.signatureHtml}</div>` : '',
      ].filter(Boolean).join('\n') || undefined

      const mailOpts = {
        from,
        to: msg.to,
        cc: msg.cc || undefined,
        subject: msg.subject,
        text: htmlToText(msg.bodyHtml || ''),
        html: fullHtml,
        attachments,
        inReplyTo: msg.inReplyTo || undefined,
        references: msg.inReplyTo || undefined,
      }

      const raw = await buildRaw(mailOpts)
      const transport = createSmtpTransport(msg.userEmail, msg.userPassword)

      await transport.sendMail({
        envelope: {
          from: msg.userEmail,
          to: [msg.to, ...(msg.cc ? msg.cc.split(',').map(s => s.trim()) : [])],
        },
        raw,
      })

      // Append to Sent (non-fatal)
      const imap = createImapClient(msg.userEmail, msg.userPassword)
      try {
        await imap.connect()
        for (const folder of ['Sent', 'INBOX.Sent', 'Sent Messages']) {
          try { await imap.append(folder, raw, ['\\Seen']); break } catch { /* try next */ }
        }
      } catch { /* non-fatal */ } finally {
        try { await imap.logout() } catch { /* ignore */ }
      }

      await removeScheduled(msg.id)
      results.push({ id: msg.id, ok: true })
    } catch (e) {
      results.push({ id: msg.id, ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
