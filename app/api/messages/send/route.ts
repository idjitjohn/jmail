import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData } from '@/lib/userdata'
import { deliverMessage, readOutgoing, validateOutgoing } from '@/lib/outgoing'

export const POST = async (req: NextRequest) => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const message = await readOutgoing(await req.formData())
    validateOutgoing(message)
    const { name } = await getUserData(session.email)
    const result = await deliverMessage({ ...session, name }, message)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not send this message.',
      },
      { status: 400 },
    )
  }
}
