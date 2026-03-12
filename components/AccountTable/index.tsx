'use client'

import { useState } from 'react'
import Button from '../Button'
import DeleteModal from '../DeleteModal'
import ResetPasswordModal from '../ResetPasswordModal'
import DomainFilter from '../DomainFilter'
import { useToast } from '../Toast'
import './AccountTable.scss'

interface Props {
  accounts: string[]
  onRefresh: () => void
}

export default function AccountTable({ accounts, onRefresh }: Props) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const filtered = accounts.filter(email => {
    if (domain && !email.endsWith(`@${domain}`)) return false
    if (search && !email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/${encodeURIComponent(deleteTarget)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(`Deleted ${deleteTarget}`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReset = async (password: string) => {
    if (!resetTarget) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/${encodeURIComponent(resetTarget)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(`Password reset for ${resetTarget}`, 'success')
      setResetTarget(null)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Reset failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="AccountTable">
      <div className="controls">
        <input
          className="search"
          type="search"
          placeholder="Search accounts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <DomainFilter value={domain} onChange={setDomain} />
      </div>

      <div className="count">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</div>

      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Domain</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={3} className="empty-row">No accounts found</td>
            </tr>
          ) : (
            filtered.map(email => {
              const [local, dom] = email.split('@')
              return (
                <tr key={email}>
                  <td className="email-cell">
                    <span className="local">{local}</span>
                    <span className="at">@</span>
                    <span className="domain">{dom}</span>
                  </td>
                  <td className="domain-cell">{dom}</td>
                  <td className="actions-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetTarget(email)}
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(email)}
                      className="danger-ghost"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <DeleteModal
        isOpen={!!deleteTarget}
        email={deleteTarget || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={actionLoading}
      />

      <ResetPasswordModal
        isOpen={!!resetTarget}
        email={resetTarget || ''}
        onConfirm={handleReset}
        onCancel={() => setResetTarget(null)}
        loading={actionLoading}
      />
    </div>
  )
}
