'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import './DeleteModal.scss'

interface Props {
  isOpen: boolean
  email: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteModal({
  isOpen,
  email,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const { t } = useLocale()

  if (!isOpen) return null

  return (
    <div className="DeleteModal" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onCancel} />
      <div className="panel">
        <div className="panel-icon" />
        <h2 className="panel-title">{t('Delete account')}</h2>
        <p className="panel-desc">
          {t('Are you sure you want to delete {email}?', { email })}
          <br />
          {t('This will remove the IMAP mailbox and credentials permanently.')}
        </p>
        <div className="panel-actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {t('Delete account')}
          </Button>
        </div>
      </div>
    </div>
  )
}
