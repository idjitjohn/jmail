import { NextResponse } from 'next/server'
import { getAdminSession, adminUnauthorized, logAdminAction } from '@/lib/admin'
import { getMailServer } from '@/lib/maddy-admin'
import { checkDns, checkMailbox, getDiagnosticDomain, sendDiagnostic, validateAddress } from '@/lib/mail-diagnostics'

export const runtime = 'nodejs'
export const maxDuration = 60
const limits = new Map<string, { count: number, until: number }>()

export const POST = async (request: Request) => {
  const session = await getAdminSession()
  if (!session) return adminUnauthorized()
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  const current = limits.get(session.email)
  const limit = current && current.until > Date.now() ? current : { count: 0, until: Date.now() + 60000 }
  limits.set(session.email, limit)
  if (++limit.count > 12) return NextResponse.json({ error: 'Wait a minute before running more tests' }, { status: 429 })
  try {
    const raw = await request.text()
    if (raw.length > 12000) throw new Error('Request too large')
    const input = JSON.parse(raw)
    if (input.mode === 'dns') return NextResponse.json(await checkDns(await getDiagnosticDomain(input.domain)))
    const email = validateAddress(input.email || session.email)
    const password = email === session.email && !input.password ? session.password : input.password
    if (typeof password !== 'string' || !password || password.length > 1000) throw new Error('Enter this mailbox’s password for the test')
    await getDiagnosticDomain(email.split('@')[1])
    if (input.mode === 'receive') {
      if (input.token && (typeof input.token !== 'string' || !/^jmail-test-[a-f0-9-]{36}$/.test(input.token))) throw new Error('Invalid test token')
      return NextResponse.json(await checkMailbox(email, password, input.token || undefined))
    }
    if (!['send', 'forward'].includes(input.mode)) throw new Error('Unknown diagnostic test')
    const recipient = validateAddress(input.recipient)
    if (input.mode === 'forward') {
      const state = await getMailServer()
      if (!state.forwardingReady || !state.forwarding.some(rule => rule.source === recipient)) throw new Error('Choose a mailbox with an active Maddy forwarding rule as the test recipient')
    }
    const result = await sendDiagnostic(email, password, recipient, input.mode)
    await logAdminAction('MAIL_TEST', `${input.mode} from ${email} to ${recipient} by ${session.email}`)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Test failed' }, { status: 400 })
  }
}
