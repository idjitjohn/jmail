'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MailFolder } from '@/lib/types'

export function useSidebar() {
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      if (!res.ok) throw new Error('Could not load folders.')
      const data = await res.json()
      setFolders(data)
      setError('')
    } catch {
      setError('Folders are unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IMAP folder synchronization
    fetchFolders()
  }, [fetchFolders])

  return { folders, loading, error, refetch: fetchFolders }
}
