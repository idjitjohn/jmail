import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getUserData, setUserData } from '@/lib/userdata'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await getUserData(session.email)
  return NextResponse.json({ name: data.name ?? '' })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { name } = await req.json()

  await setUserData(session.email, { name: name?.trim() ?? '' })
  return NextResponse.json({ ok: true })
}
