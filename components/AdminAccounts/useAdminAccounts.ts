'use client'

import { useState } from 'react'

export function useAdminAccounts(initialAccounts: string[]) {
  const [accounts, setAccounts] = useState(initialAccounts)

  const refresh = async () => {
    const res = await fetch('/api/admin/accounts')
    const data = await res.json()
    if (Array.isArray(data)) setAccounts(data)
  }

  return { accounts, refresh }
}
