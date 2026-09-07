'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { MailMessage } from '@/lib/types'
import type { MailFilter } from '@/lib/mail-search'
import { groupIntoThreads } from '@/lib/threads'
import type { MailListOptions } from './types'

export const useMailList = ({
  folder,
  refreshTrigger,
  selectedThread,
  onSelect,
  onRefresh,
}: MailListOptions) => {
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [resultKey, setResultKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MailFilter>('all')
  const [refreshCount, setRefreshCount] = useState(0)
  const [markingRead, setMarkingRead] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchMessages = useCallback(
    async (pg = 1) => {
      requestRef.current?.abort()
      const controller = new AbortController()
      requestRef.current = controller
      loadingRef.current = true
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          folder,
          page: String(pg),
          q: query,
          filter,
        })
        const endpoint =
          query || filter !== 'all' ? '/api/messages/search' : '/api/messages'
        const res = await fetch(`${endpoint}?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok)
          throw new Error('Could not load your messages. Please try again.')
        const data = await res.json()
        if (controller.signal.aborted) return
        setMessages((prev) =>
          pg === 1
            ? data.messages
            : [
                ...prev,
                ...data.messages.filter(
                  (m: MailMessage) => !prev.some((p) => p.uid === m.uid),
                ),
              ],
        )
        setResultKey(`${folder}:${query}:${filter}`)
        setHasMore(data.hasMore)
        setTotal(data.total)
        setPage(pg)
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Could not load messages')
      } finally {
        if (!controller.signal.aborted) {
          loadingRef.current = false
          setLoading(false)
        }
      }
    },
    [folder, query, filter],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IMAP request synchronization
    void fetchMessages()
    return () => requestRef.current?.abort()
  }, [fetchMessages, refreshTrigger, refreshCount])

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), [])
  const threads = useMemo(
    () =>
      groupIntoThreads(
        resultKey === `${folder}:${query}:${filter}` ? messages : [],
      ),
    [messages, resultKey, folder, query, filter],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        document.querySelector('[aria-modal="true"]')
      )
        return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (['j', 'k'].includes(event.key.toLowerCase()) && threads.length) {
        event.preventDefault()
        const index = threads.findIndex(
          (thread) => thread.id === selectedThread?.id,
        )
        const next =
          index < 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  threads.length - 1,
                  index + (event.key.toLowerCase() === 'j' ? 1 : -1),
                ),
              )
        onSelect(threads[next])
      }
    }
    const focusSearch = () => searchRef.current?.focus()
    window.addEventListener('keydown', handleKey)
    window.addEventListener('jmail:search', focusSearch)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('jmail:search', focusSearch)
    }
  }, [threads, selectedThread, onSelect])

  useEffect(() => {
    document
      .querySelector('.MailItem.selected')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedThread?.id])

  const markAllRead = async () => {
    if (markingRead) return
    setMarkingRead(true)
    try {
      const res = await fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!res.ok)
        throw new Error('Could not mark messages as read. Please try again.')
      refresh()
      onRefresh?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update messages')
    } finally {
      setMarkingRead(false)
    }
  }

  const handleSwipeDelete = async (
    thread: import('@/lib/types').MailThread,
  ) => {
    try {
      const results = await Promise.all(
        thread.messages.map((message) =>
          fetch(
            `/api/messages/${message.uid}?folder=${encodeURIComponent(folder)}`,
            { method: 'DELETE' },
          ),
        ),
      )
      if (results.some((result) => !result.ok))
        throw new Error('Some messages could not be deleted. Please try again.')
      refresh()
      onRefresh?.()
      return true
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not delete these messages.',
      )
      return false
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setQuery('')
    searchRef.current?.focus()
  }

  return {
    threads,
    loading,
    error,
    hasMore,
    total,
    refresh,
    searchQuery,
    setSearchQuery,
    searchRef,
    filter,
    setFilter,
    clearSearch,
    markAllRead,
    markingRead,
    loadMore: () => {
      if (!loadingRef.current && hasMore) void fetchMessages(page + 1)
    },
    handleSwipeDelete,
    folderLabel: folder === 'INBOX' ? 'Inbox' : folder,
    emptyTitle: query
      ? 'No matches just yet'
      : filter === 'unread'
        ? 'You’re all caught up'
        : filter === 'starred'
          ? 'Keep the good stuff close'
          : 'A little breathing room',
    emptyDescription: query
      ? 'Try another name, subject, or phrase.'
      : filter === 'unread'
        ? 'No unread messages. Enjoy a moment of focus.'
        : filter === 'starred'
          ? 'Star a message to find it here whenever you need it.'
          : 'No messages in this folder. Your next conversation starts here.',
  }
}
