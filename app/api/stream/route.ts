import { type NextRequest } from 'next/server'
import { getSession, unauthorized, verifySession } from '@/lib/auth'
import { subscribe, unsubscribe, hasSubscribers } from '@/lib/sse-manager'
import { startIdleMonitor, stopIdleMonitor } from '@/lib/imap-pool'
import type { SSEEvent } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = async (request: NextRequest) => {
  const session = await getSession()
  if (!session) return unauthorized()
  const { email, password } = session
  const token = request.cookies.get('session')?.value || ''
  let cleanup = () => {}
  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (event: SSEEvent) => {
        if (closed) return
        try {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          cleanup()
        }
      }
      const ping = setInterval(() => {
        void verifySession(token)
          .then((current) => (current ? send({ type: 'ping' }) : cleanup()))
          .catch(() => cleanup())
      }, 25000)
      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(ping)
        request.signal.removeEventListener('abort', cleanup)
        unsubscribe(email, send)
        if (!hasSubscribers(email)) stopIdleMonitor(email)
        try {
          controller.close()
        } catch {
          /* Disconnected stream */
        }
      }
      if (request.signal.aborted) return cleanup()
      request.signal.addEventListener('abort', cleanup, { once: true })
      subscribe(email, send, cleanup)
      startIdleMonitor(email, password)
      send({ type: 'connected' })
    },
    cancel() {
      cleanup()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'private, no-store, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
