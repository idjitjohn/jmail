'use client'

import Button from '../Button'
import './DeleteModal.scss'

interface Props {
  isOpen: boolean
  email: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteModal({ isOpen, email, onConfirm, onCancel, loading }: Props) {
  if (!isOpen) return null

  return (
    <div className="DeleteModal" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onCancel} />
      <div className="panel">
        <div className="panel-icon">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
          </svg>
        </div>
        <h2 className="panel-title">Delete account</h2>
        <p className="panel-desc">
          Are you sure you want to delete <strong>{email}</strong>?
          <br />This will remove the IMAP mailbox and credentials permanently.
        </p>
        <div className="panel-actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete account</Button>
        </div>
      </div>
    </div>
  )
}
