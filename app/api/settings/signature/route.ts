import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData, setUserData } from '@/lib/userdata'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await getUserData(session.email)
  return NextResponse.json({ signature: data.signature ?? '' })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { signature } = await req.json()

  await setUserData(session.email, { signature: signature ?? '' })
  return NextResponse.json({ ok: true })
}
