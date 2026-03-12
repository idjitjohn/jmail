'use client'

import Link from 'next/link'
import AccountTable from '../AccountTable'
import { useAdminAccounts } from './useAdminAccounts'
import './AdminAccounts.scss'

interface Props {
  initialAccounts: string[]
}

export default function AdminAccounts({ initialAccounts }: Props) {
  const { accounts, refresh } = useAdminAccounts(initialAccounts)

  return (
    <div className="AdminAccounts">
      <div className="page-actions">
        <Link href="/admin/accounts/new" className="new-btn">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
          </svg>
          New account
        </Link>
      </div>
      <AccountTable accounts={accounts} onRefresh={refresh} />
    </div>
  )
}
