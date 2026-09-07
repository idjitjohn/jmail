import { NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction } from '@/lib/admin'
import { getMailServer, maddyAdmin } from '@/lib/maddy-admin'

export const runtime = 'nodejs'
export const maxDuration = 240

export const GET = async () => {
  if (!await getAdminSession()) return adminUnauthorized()
  try {
    return NextResponse.json(await getMailServer())
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server unavailable' }, { status: 503 })
  }
}

export const POST = async (request: Request) => {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  try {
    const body = await request.text()
    if (body.length > 16000) throw new Error('Request too large')
    const input = JSON.parse(body)
    if (!['preview', 'apply'].includes(input.action)) throw new Error('Invalid action')
    const data = await maddyAdmin(input)
    if (input.action === 'apply') await logAdminAction('MAIL_SERVER_UPDATE', `${input.kind} by ${session.email}`)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 400 })
  }
}
