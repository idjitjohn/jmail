import type { SSEEvent } from './types'

type Sender = (event: SSEEvent) => void

// Global singleton — survives hot reload in dev
const g = globalThis as any
if (!g._sseSubs) g._sseSubs = new Map<string, Set<Sender>>()
const subs: Map<string, Set<Sender>> = g._sseSubs

export function subscribe(email: string, send: Sender): void {
  if (!subs.has(email)) subs.set(email, new Set())
  subs.get(email)!.add(send)
}

export function unsubscribe(email: string, send: Sender): void {
  subs.get(email)?.delete(send)
  if ((subs.get(email)?.size ?? 0) === 0) subs.delete(email)
}

export function broadcast(email: string, event: SSEEvent): void {
  subs.get(email)?.forEach(send => {
    try { send(event) } catch { /* disconnected */ }
  })
}

export function hasSubscribers(email: string): boolean {
  return (subs.get(email)?.size ?? 0) > 0
}
