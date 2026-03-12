'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MailMessage } from '@/lib/types'

export function useMailViewer(uid: number | null, folder: string) {
  const [message, setMessage] = useState<MailMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessage = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/messages/${uid}?folder=${encodeURIComponent(folder)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load message')
      }
      const data = await res.json()
      setMessage(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [uid, folder])

  useEffect(() => {
    if (uid) {
      fetchMessage()
    } else {
      setMessage(null)
    }
  }, [uid, fetchMessage])

  const markRead = useCallback(async (isRead: boolean) => {
    if (!uid) return
    await fetch(`/api/messages/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead, folder }),
    })
  }, [uid, folder])

  const deleteMessage = useCallback(async () => {
    if (!uid) return
    await fetch(`/api/messages/${uid}?folder=${encodeURIComponent(folder)}`, {
      method: 'DELETE',
    })
  }, [uid, folder])

  const moveMessage = useCallback(async (targetFolder: string) => {
    if (!uid) return
    await fetch(`/api/messages/${uid}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, targetFolder }),
    })
  }, [uid, folder])

  return { message, loading, error, markRead, deleteMessage, moveMessage }
}
