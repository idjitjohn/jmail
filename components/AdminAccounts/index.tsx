'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'
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
  const { t, number } = useLocale()

  const vm = useAdminAccounts(initialAccounts, initialError, domains)
  return (
    <div className="AdminAccounts">
      <div className="welcome">
        <div className="copy">
          <p className="eyebrow">{t('Your mail, together')}</p>
          <h2>{t('A mailbox for everyone.')}</h2>
          <p>
            {t(
              'Create addresses, find a person, and help them get back into their mail.',
            )}
          </p>
        </div>
        <Link href="/admin/accounts/new" className="new-btn">
          {t('Create mailbox')}
        </Link>
      </div>
      <div className="overview">
        <div className="metric">
          <strong>{vm.error ? '—' : number(vm.accounts.length)}</strong>
          <span>{t('Mailboxes')}</span>
        </div>
        <Link href="/admin/mail-server" className="metric">
          <strong>
            {typeof vm.domainCount === 'number'
              ? number(vm.domainCount)
              : vm.domainCount}
          </strong>
          <span>{t('Domains · manage')}</span>
        </Link>
        <Link href="/admin/mail-server?tab=diagnostics" className="help-card">
          <strong>{t('A message didn’t arrive?')}</strong>
          <span>{t('Check delivery and domain authentication →')}</span>
        </Link>
      </div>
      {vm.error && (
        <div className="error" role="alert">
          <p>{t(vm.error)}</p>
          <button type="button" disabled={vm.loading} onClick={vm.refresh}>
            {t('Try again')}
          </button>
        </div>
      )}
      {!vm.error && vm.accounts.length === 0 ? (
        <div className="empty">
          <h3>{t('Welcome to your mail workspace')}</h3>
          <p>
            {t('Start by connecting a domain, then create the first mailbox.')}
          </p>
          <Link href="/admin/mail-server">{t('Set up a domain →')}</Link>
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
