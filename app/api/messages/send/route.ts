import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { createSmtpTransport } from '@/lib/mail'
import { getUserData } from '@/lib/userdata'

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

  const transport = createSmtpTransport(session.email, session.password)

  try {
    await transport.sendMail({
      from,
      to,
      cc: cc || undefined,
      subject,
      text: body,
      html: body ? `<pre style="font-family:inherit;white-space:pre-wrap">${body}</pre>` : undefined,
      inReplyTo: inReplyTo || undefined,
      references: inReplyTo || undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
