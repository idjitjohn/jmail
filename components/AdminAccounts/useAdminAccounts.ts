'use client'
import { useState } from 'react'

export const useAdminAccounts = (
  initialAccounts: string[],
  initialError: string,
  domains: string[] = [],
) => {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [error, setError] = useState(initialError)
  const [loading, setLoading] = useState(false)
  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/accounts')
      const data = await response.json()
      if (!response.ok || !Array.isArray(data))
        throw new Error(data.error || 'Could not load mailboxes.')
      setAccounts(data)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not load mailboxes.',
      )
    } finally {
      setLoading(false)
    }
  }
  return {
    accounts,
    error,
    loading,
    refresh,
    domainCount:
      error && !domains.length
        ? '—'
        : new Set([...domains, ...accounts.map((email) => email.split('@')[1])])
            .size,
  }
}
