import { useState } from 'react'
import { useToast } from '../Toast'
import type { AccountGroup } from './types'

export const useAccountTable = (accounts: string[], onRefresh: () => void) => {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const query = search.trim().toLowerCase()
  const grouped = new Map<string, AccountGroup>()
  const allDomains = new Set<string>()

  for (const email of accounts) {
    const [local, host] = email.split('@')
    const accountDomain = host.toLowerCase()
    allDomains.add(accountDomain)
    if (domain && domain !== accountDomain) continue
    if (query && !email.toLowerCase().includes(query)) continue
    const group = grouped.get(accountDomain) || {
      domain: accountDomain,
      accounts: [],
    }
    group.accounts.push({ email, local })
    grouped.set(accountDomain, group)
  }

  const compare = (a: string, b: string) =>
    a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
  const domains = [...allDomains].sort(compare)
  const groups = [...grouped.values()].sort((a, b) =>
    compare(a.domain, b.domain),
  )
  for (const group of groups) {
    group.accounts.sort((a, b) => compare(a.email, b.email))
  }
  const count = groups.reduce(
    (total, group) => total + group.accounts.length,
    0,
  )

  const clearFilters = () => {
    setSearch('')
    setDomain('')
  }

  const cancelDelete = () => {
    if (!actionLoading) setDeleteTarget(null)
  }

  const cancelReset = () => {
    if (!actionLoading) setResetTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/accounts/${encodeURIComponent(deleteTarget)}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(`Deleted ${deleteTarget}`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Delete failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReset = async (password: string) => {
    if (!resetTarget || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/admin/accounts/${encodeURIComponent(resetTarget)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(`Password reset for ${resetTarget}`, 'success')
      setResetTarget(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Reset failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return {
    search,
    setSearch,
    domain,
    setDomain,
    domains,
    groups,
    count,
    hasFilters: Boolean(search || domain),
    clearFilters,
    deleteTarget,
    setDeleteTarget,
    resetTarget,
    setResetTarget,
    actionLoading,
    cancelDelete,
    cancelReset,
    handleDelete,
    handleReset,
  }
}
