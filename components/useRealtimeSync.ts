'use client'

import { useEffect, useRef } from 'react'
import type { SSEEvent } from '@/lib/types'

interface Handlers {
  onNewMail?: (folder: string, count: number) => void
  onFlagUpdate?: (folder: string, uid: number, isRead: boolean) => void
  onMailExpunged?: (folder: string) => void
  onUnreadCounts?: (counts: Record<string, number>) => void
}

export function useRealtimeSync(handlers: Handlers): void {
  // Stable ref — handlers can change without restarting EventSource
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const es = new EventSource('/api/stream')

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data as string)
        const h = ref.current
        switch (event.type) {
          case 'new_mail':
            h.onNewMail?.(event.folder, event.count)
            break
          case 'flag_update':
            h.onFlagUpdate?.(event.folder, event.uid, event.isRead)
            break
          case 'mail_expunged':
            h.onMailExpunged?.(event.folder)
            break
          case 'unread_counts':
            h.onUnreadCounts?.(event.counts)
            break
        }
      } catch { /* ignore parse errors */ }
    }

    // EventSource auto-reconnects on error — no manual handling needed
    return () => es.close()
  }, [])
}
