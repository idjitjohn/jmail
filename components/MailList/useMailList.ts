'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { MailMessage } from '@/lib/types'
import { groupIntoThreads } from '@/lib/threads'

export function useMailList(folder: string) {
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchMessages = useCallback(async (pg = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ folder, page: String(pg) })
      const res = await fetch(`/api/messages?${params}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load messages')
      }

      const data = await res.json()
      setMessages(pg === 1 ? data.messages : prev => [...prev, ...data.messages])
      setHasMore(data.hasMore)
      setPage(pg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [folder])

  useEffect(() => {
    fetchMessages(1)
  }, [fetchMessages])

  const loadMore = () => {
    if (!loading && hasMore) fetchMessages(page + 1)
  }

  const refresh = () => fetchMessages(1)

  const threads = useMemo(() => groupIntoThreads(messages), [messages])

  return { messages, threads, loading, error, hasMore, loadMore, refresh }
}
