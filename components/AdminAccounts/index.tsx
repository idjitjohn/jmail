'use client'
import Link from 'next/link'
import AccountTable from '../AccountTable'
import { useAdminAccounts } from './useAdminAccounts'
import './AdminAccounts.scss'

type Props = {
  initialAccounts: string[]
  domains?: string[]
  initialError?: string
}
const AdminAccounts = ({
  initialAccounts,
  domains = [],
  initialError = '',
}: Props) => {
  const vm = useAdminAccounts(initialAccounts, initialError, domains)
  return (
    <div className="AdminAccounts">
      <div className="welcome">
        <div className="copy">
          <p className="eyebrow">Your mail, together</p>
          <h2>A mailbox for everyone.</h2>
          <p>
            Create addresses, find a person, and help them get back into their
            mail.
          </p>
        </div>
        <Link href="/admin/accounts/new" className="new-btn">
          Create mailbox
        </Link>
      </div>
      <div className="overview">
        <div className="metric">
          <strong>{vm.error ? '—' : vm.accounts.length}</strong>
          <span>Mailboxes</span>
        </div>
        <Link href="/admin/mail-server" className="metric">
          <strong>
            {
              new Set([
                ...domains,
                ...vm.accounts.map((email) => email.split('@')[1]),
              ]).size
            }
          </strong>
          <span>Domains · manage</span>
        </Link>
        <Link href="/admin/mail-server?tab=diagnostics" className="help-card">
          <strong>A message didn’t arrive?</strong>
          <span>Check delivery and domain authentication →</span>
        </Link>
      </div>
      {vm.error && (
        <div className="error" role="alert">
          <p>{vm.error}</p>
          <button type="button" disabled={vm.loading} onClick={vm.refresh}>
            Try again
          </button>
        </div>
      )}
      {!vm.error && vm.accounts.length === 0 ? (
        <div className="empty">
          <h3>Welcome to your mail workspace</h3>
          <p>Start by connecting a domain, then create the first mailbox.</p>
          <Link href="/admin/mail-server">Set up a domain →</Link>
        </div>
      ) : (
        !vm.error && (
          <AccountTable accounts={vm.accounts} onRefresh={vm.refresh} />
        )
      )}
    </div>
  )
}
export default AdminAccounts
