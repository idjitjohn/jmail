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
          New account
        </Link>
      </div>
      <AccountTable accounts={accounts} onRefresh={refresh} />
    </div>
  )
}
