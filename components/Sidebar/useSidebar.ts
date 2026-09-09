'use client'

import { useState, useEffect, useCallback } from 'react'
import { readApiResponse } from '@/lib/api-client'
import type { MailFolder } from '@/lib/types'

export function useSidebar() {
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      const data = await readApiResponse<MailFolder[]>(
        res,
        'Could not load folders.',
      )
      setFolders(data)
      setError('')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Folders are unavailable. Please try again.',
      )
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
