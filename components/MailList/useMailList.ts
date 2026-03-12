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
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

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
    setSearchQuery('')
    fetchMessages(1)
  }, [fetchMessages])

  const search = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      fetchMessages(1)
      return
    }
    setSearching(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q, folder })
      const res = await fetch(`/api/messages/search?${params}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setMessages(data.messages)
      setHasMore(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }, [folder, fetchMessages])

  const loadMore = () => {
    if (!loading && hasMore) fetchMessages(page + 1)
  }

  const refresh = () => {
    setSearchQuery('')
    fetchMessages(1)
  }

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!res.ok) throw new Error('Failed')
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })))
    } catch { /* non-fatal */ }
  }, [folder])

  const threads = useMemo(() => groupIntoThreads(messages), [messages])

  return { messages, threads, loading, error, hasMore, loadMore, refresh, searchQuery, search, searching, markAllRead }
}
