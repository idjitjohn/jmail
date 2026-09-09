import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { readSieveConfig, trySaveSieveConfig } from '@/lib/sieve'

const available = () => process.env.JMAIL_SIEVE_VACATION_ENABLED === 'true'

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const config = await readSieveConfig(session.email)
    return NextResponse.json({
      ...(config.vacation || { subject: '', message: '', days: 7 }),
      enabled: available() && Boolean(config.vacation),
      available: available(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not load automatic replies. Please try again.' },
      { status: 503 },
    )
  }
}

const update = async (request: Request, remove: boolean) => {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!remove && !available())
    return NextResponse.json(
      {
        error:
          'Automatic replies are not connected on this server. Contact your administrator.',
      },
      { status: 409 },
    )
  const input = remove ? null : await request.json().catch(() => null)
  if (
    !remove &&
    (typeof input?.subject !== 'string' ||
      !input.subject.trim() ||
      input.subject.length > 200 ||
      /[\r\n\x00]/.test(input.subject) ||
      typeof input?.message !== 'string' ||
      !input.message.trim() ||
      input.message.length > 10000 ||
      /\x00/.test(input.message) ||
      !Number.isInteger(input.days) ||
      input.days < 1 ||
      input.days > 30)
  )
    return NextResponse.json(
      {
        error:
          'Add a subject, a message and a reply interval from 1 to 30 days.',
      },
      { status: 400 },
    )
  try {
    const error = await trySaveSieveConfig(session.email, {
      vacation: remove
        ? null
        : {
            subject: input.subject.trim(),
            message: input.message.trim(),
            days: input.days,
          },
    })
    if (error) return NextResponse.json({ error }, { status: 503 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not save automatic replies. Please try again.' },
      { status: 503 },
    )
  }
}
export const POST = (request: Request) => update(request, false)
export const DELETE = (request: Request) => update(request, true)
