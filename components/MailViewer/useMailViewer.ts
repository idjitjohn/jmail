'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MailMessage, MailThread } from '@/lib/types'

export function useMailViewer(thread: MailThread | null, folder: string) {
  // UIDs currently expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  // Full message content keyed by UID
  const [fullMessages, setFullMessages] = useState<Map<number, MailMessage>>(new Map())
  // Loading state for initial expand
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track fetched UIDs to avoid duplicate requests
  const fetchedRef = useRef<Set<number>>(new Set())

  const fetchFull = useCallback(async (uid: number) => {
    if (fetchedRef.current.has(uid)) return
    fetchedRef.current.add(uid)
    try {
      const res = await fetch(`/api/messages/${uid}?folder=${encodeURIComponent(folder)}`)
      if (!res.ok) throw new Error('Failed to load message')
      const data = await res.json()
      setFullMessages(prev => new Map([...prev, [uid, data]]))
    } catch (e) {
      fetchedRef.current.delete(uid) // allow retry
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }, [folder])

  // Reset when thread changes, auto-expand and load latest
  useEffect(() => {
    if (!thread) {
      setExpanded(new Set())
      setFullMessages(new Map())
      fetchedRef.current = new Set()
      setError(null)
      return
    }

    const latestUid = thread.latest.uid
    setExpanded(new Set([latestUid]))
    setFullMessages(new Map())
    fetchedRef.current = new Set()
    setError(null)

    setLoading(true)
    fetchFull(latestUid).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, folder])

  const toggleExpand = useCallback((uid: number) => {
    setExpanded(prev => {
      const s = new Set(prev)
      if (s.has(uid)) {
        s.delete(uid)
      } else {
        s.add(uid)
        fetchFull(uid)
      }
      return s
    })
  }, [fetchFull])

  const deleteMessage = useCallback(async (uid: number) => {
    await fetch(`/api/messages/${uid}?folder=${encodeURIComponent(folder)}`, {
      method: 'DELETE',
    })
  }, [folder])

  const markRead = useCallback(async (uid: number, isRead: boolean) => {
    await fetch(`/api/messages/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead, folder }),
    })
  }, [folder])

  return { expanded, fullMessages, loading, error, toggleExpand, deleteMessage, markRead }
}
