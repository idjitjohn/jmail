import { type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { subscribe, unsubscribe, hasSubscribers } from '@/lib/sse-manager'
import { startIdleMonitor, stopIdleMonitor } from '@/lib/imap-pool'
import type { SSEEvent } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encode(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password } = session

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encode(event))

      subscribe(email, send)
      startIdleMonitor(email, password)
      send({ type: 'connected' })

      const ping = setInterval(() => {
        try { send({ type: 'ping' }) } catch { clearInterval(ping) }
      }, 30_000)

      req.signal.addEventListener('abort', () => {
        clearInterval(ping)
        unsubscribe(email, send)
        if (!hasSubscribers(email)) stopIdleMonitor(email)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
