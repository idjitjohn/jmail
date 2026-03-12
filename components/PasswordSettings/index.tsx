'use client'

import Input from '../Input'
import Button from '../Button'
import { usePasswordSettings } from './usePasswordSettings'
import './PasswordSettings.scss'

export default function PasswordSettings() {
  const { current, setCurrent, next, setNext, confirm, setConfirm, saving, saved, error, save } =
    usePasswordSettings()

  return (
    <div className="PasswordSettings">
      <div className="section-header">
        <h1 className="title">Password</h1>
        <p className="subtitle">Change your account password</p>
      </div>

      <div className="card">
        <div className="field-group">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            value={next}
            onChange={e => setNext(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="actions">
        {error && <span className="error-msg">{error}</span>}
        {saved && <span className="success-msg">Password updated</span>}
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </div>
  )
}
