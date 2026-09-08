import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized } from '@/lib/admin'
import { maddyAdmin } from '@/lib/maddy-admin'

export const GET = async (request: NextRequest) => {
  if (!(await getAdminSession())) return adminUnauthorized()
  const messageId = request.nextUrl.searchParams.get('messageId') || ''
  if (messageId && !/^[a-zA-Z0-9@._<>-]{1,100}$/.test(messageId))
    return NextResponse.json(
      { error: 'Enter a valid message ID.' },
      { status: 400 },
    )
  try {
    return NextResponse.json(await maddyAdmin({ action: 'logs', messageId }))
  } catch {
    return NextResponse.json(
      {
        error:
          'Server activity is unavailable. Update the administration helper on the Maddy server.',
      },
      { status: 503 },
    )
  }
}
