'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MailFolder } from '@/lib/types'

export function useSidebar() {
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      if (!res.ok) return
      const data = await res.json()
      setFolders(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return { folders, loading, refetch: fetchFolders }
}
