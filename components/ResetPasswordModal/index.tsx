'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useState } from 'react'
import Input from '../Input'
import Button from '../Button'
import './ResetPasswordModal.scss'

interface Props {
  isOpen: boolean
  email: string
  onConfirm: (password: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function ResetPasswordModal({
  isOpen,
  email,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const { t } = useLocale()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    onConfirm(password)
  }

  if (!isOpen) return null

  return (
    <div className="ResetPasswordModal" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onCancel} />
      <div className="panel">
        <h2 className="panel-title">{t('Reset password')}</h2>
        <p className="panel-sub">{email}</p>

        <form className="form" onSubmit={handleSubmit}>
          <Input
            label={t('New password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <Input
            label={t('Confirm password')}
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="form-error">{t(error)}</p>}
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              type="button"
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('Reset password')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
