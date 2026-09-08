import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { listLater, createLater, changeLater } from '@/lib/mail-later'

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    return NextResponse.json(await listLater(session.email))
  } catch {
    return NextResponse.json(
      { error: 'Could not load reminders.' },
      { status: 500 },
    )
  }
}
const mutate = async (request: Request, create: boolean) => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const body = await request.json()
    if (create) await createLater(session, body)
    else await changeLater(session.email, body.id, body.action)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save this reminder.',
      },
      { status: 400 },
    )
  }
}
export const POST = (request: Request) => mutate(request, true)
export const PATCH = (request: Request) => mutate(request, false)
