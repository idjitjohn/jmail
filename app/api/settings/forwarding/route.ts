import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth'
import { getMailServer, maddyAdmin, previewMailServer } from '@/lib/maddy-admin'
import { validateAddress } from '@/lib/mail-diagnostics'
import type { Change } from '@/components/MailServerAdmin/types'

export const maxDuration = 240

export const GET = async () => {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const state = await getMailServer()
    const rule = state.forwarding.find(rule => rule.source === session.email)
    return NextResponse.json({ active: !!rule, address: rule?.destination ?? null, keepCopy: rule?.keepCopy ?? true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cannot read forwarding rules' }, { status: 503 })
  }
}

const update = async (request: Request, remove: boolean) => {
  const session = await getSession()
  if (!session) return unauthorized()
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  try {
    const input = remove ? null : await request.json()
    const destination = remove ? '' : validateAddress(input.forwardTo)
    const state = await getMailServer()
    const change: Change = { kind: 'forwarding', source: session.email, destination,
      keepCopy: remove ? true : !!input.keepCopy, revision: state.revision }
    const preview = await previewMailServer(change)
    if (preview.diff) await maddyAdmin({ ...change, action: 'apply', digest: preview.digest })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cannot update forwarding' }, { status: 400 })
  }
}

export const POST = (request: Request) => update(request, false)
export const DELETE = (request: Request) => update(request, true)
