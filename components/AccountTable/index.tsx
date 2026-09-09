'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import DeleteModal from '../DeleteModal'
import ResetPasswordModal from '../ResetPasswordModal'
import DomainFilter from '../DomainFilter'
import { useAccountTable } from './useAccountTable'
import './AccountTable.scss'

type Props = {
  accounts: string[]
  onRefresh: () => void
}

const AccountTable = ({ accounts, onRefresh }: Props) => {
  const { t, plural } = useLocale()

  const vm = useAccountTable(accounts, onRefresh)

  return (
    <div className="AccountTable">
      <div className="controls">
        <input
          className="search"
          type="search"
          aria-label={t('Search mailboxes')}
          placeholder={t('Search mailboxes...')}
          value={vm.search}
          onChange={(event) => vm.setSearch(event.target.value)}
        />
        <DomainFilter
          domains={vm.domains}
          value={vm.domain}
          onChange={vm.setDomain}
        />
      </div>

      <div className="summary">
        <p className="count" role="status">
          {t('{mailboxes} across {domains}', {
            mailboxes: plural('{count} mailbox', '{count} mailboxes', vm.count),
            domains: plural(
              '{count} domain',
              '{count} domains',
              vm.groups.length,
            ),
          })}
        </p>
        {vm.hasFilters && (
          <Button variant="ghost" size="sm" onClick={vm.clearFilters}>
            {t('Clear filters')}
          </Button>
        )}
      </div>

      {vm.groups.length === 0 ? (
        <div className="empty">
          <strong>{t('No mailboxes found')}</strong>
          <p>{t('Try a different name or choose another domain.')}</p>
        </div>
      ) : (
        <div className="groups">
          {vm.groups.map((group) => (
            <section
              className="domain-group"
              key={group.domain}
              aria-label={group.domain}
            >
              <div className="group-header">
                <h3>{group.domain}</h3>
                <span className="mailbox-count">
                  {plural(
                    '{count} mailbox',
                    '{count} mailboxes',
                    group.accounts.length,
                  )}
                </span>
              </div>
              <table
                className="table"
                aria-label={t('Mailboxes for {0}', { '0': group.domain })}
              >
                <thead>
                  <tr>
                    <th scope="col">{t('Mailbox')}</th>
                    <th scope="col" className="actions-col">
                      {t('Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.accounts.map((account) => (
                    <tr key={account.email}>
                      <th scope="row" className="email-cell">
                        <span className="local">{account.local}</span>
                        <span className="address">{account.email}</span>
                      </th>
                      <td className="actions-cell">
                        <div className="actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => vm.setResetTarget(account.email)}
                          >
                            {t('Reset password')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => vm.setDeleteTarget(account.email)}
                            className="danger-ghost"
                          >
                            {t('Delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      <DeleteModal
        isOpen={!!vm.deleteTarget}
        email={vm.deleteTarget || ''}
        onConfirm={vm.handleDelete}
        onCancel={vm.cancelDelete}
        loading={vm.actionLoading}
      />

      <ResetPasswordModal
        key={vm.resetTarget || 'reset'}
        isOpen={!!vm.resetTarget}
        email={vm.resetTarget || ''}
        onConfirm={vm.handleReset}
        onCancel={vm.cancelReset}
        loading={vm.actionLoading}
      />
    </div>
  )
}

export default AccountTable
