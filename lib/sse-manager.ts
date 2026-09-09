import type { SSEEvent } from './types'

type Sender = (event: SSEEvent) => void

// Global singleton — survives hot reload in dev
const g = globalThis as typeof globalThis & {
  _sseSubs?: Map<string, Set<Sender>>
  _sseClosers?: Map<string, Map<Sender, () => void>>
  _sseSessions?: Map<Sender, string>
}
if (!g._sseSubs) g._sseSubs = new Map<string, Set<Sender>>()
const subs: Map<string, Set<Sender>> = g._sseSubs
const closers = (g._sseClosers ||= new Map<string, Map<Sender, () => void>>())
const sessions = (g._sseSessions ||= new Map<Sender, string>())

export function subscribe(
  email: string,
  send: Sender,
  close?: () => void,
  sessionId?: string,
): void {
  if (!subs.has(email)) subs.set(email, new Set())
  subs.get(email)!.add(send)
  if (sessionId) sessions.set(send, sessionId)
  if (close) {
    if (!closers.has(email)) closers.set(email, new Map())
    closers.get(email)!.set(send, close)
  }
}

export function unsubscribe(email: string, send: Sender): void {
  sessions.delete(send)
  closers.get(email)?.delete(send)
  if (!closers.get(email)?.size) closers.delete(email)
  subs.get(email)?.delete(send)
  if ((subs.get(email)?.size ?? 0) === 0) subs.delete(email)
}

export const disconnectStreams = (email: string) => {
  closers.get(email)?.forEach((close) => close())
  closers.delete(email)
  subs.delete(email)
}

export const disconnectSessionStreams = (email: string, sessionId: string) => {
  for (const [send, close] of closers.get(email) || []) {
    if (sessions.get(send) === sessionId) close()
  }
}

export function broadcast(email: string, event: SSEEvent): void {
  subs.get(email)?.forEach((send) => {
    try {
      send(event)
    } catch {
      /* disconnected */
    }
  })
}

export function hasSubscribers(email: string): boolean {
  return (subs.get(email)?.size ?? 0) > 0
}
