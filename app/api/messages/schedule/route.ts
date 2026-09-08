import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData } from '@/lib/userdata'
import { addScheduled, listScheduled, changeScheduled } from '@/lib/scheduled'
import { readOutgoing, validateOutgoing } from '@/lib/outgoing'

const futureDate = (value: unknown) => {
  const date = new Date(typeof value === 'string' ? value : '')
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
    throw new Error('Choose a date and time in the future.')
  return date.toISOString()
}
export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    return NextResponse.json({
      messages: await listScheduled(session.email),
      schedulerReady: Boolean(process.env.CRON_SECRET),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not load scheduled messages.' },
      { status: 500 },
    )
  }
}
export const POST = async (req: NextRequest) => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    if (!process.env.CRON_SECRET)
      throw new Error(
        'Scheduled sending is not configured. Contact your administrator.',
      )
    const fd = await req.formData()
    const message = await readOutgoing(fd)
    validateOutgoing(message)
    const { name } = await getUserData(session.email)
    const id = await addScheduled({
      ...message,
      sendAt: futureDate(fd.get('scheduleAt')),
      userEmail: session.email,
      userPassword: session.password,
      name,
    })
    return NextResponse.json({ ok: true, id })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not schedule this message.',
      },
      { status: 400 },
    )
  }
}
const change = async (req: NextRequest, remove: boolean) => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const body = await req.json()
    await changeScheduled(
      session.email,
      body.id,
      remove ? undefined : futureDate(body.sendAt),
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not change this message.',
      },
      { status: 400 },
    )
  }
}
export const PATCH = (req: NextRequest) => change(req, false)
export const DELETE = (req: NextRequest) => change(req, true)
