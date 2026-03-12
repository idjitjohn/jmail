'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useForwardingSettings } from './useForwardingSettings'
import './ForwardingSettings.scss'

export default function ForwardingSettings() {
  const {
    enabled, setEnabled,
    forwardTo, setForwardTo,
    keepCopy, setKeepCopy,
    loading, saving, saved, error,
    save,
  } = useForwardingSettings()

  if (loading) {
    return (
      <div className="ForwardingSettings">
        <div className="loading">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="ForwardingSettings">
      <div className="section-header">
        <div className="section-title">
          <h1 className="title">Forwarding</h1>
          <p className="subtitle">Automatically forward incoming mail to another address</p>
        </div>
      </div>

      <div className="card">
        <div className="row toggle-row">
          <div className="row-label">
            <span className="label">Enable forwarding</span>
          </div>
          <button
            type="button"
            className={`toggle ${enabled ? 'on' : 'off'}`}
            onClick={() => setEnabled(v => !v)}
            role="switch"
            aria-checked={enabled}
          >
            <span className="thumb" />
          </button>
        </div>

        {enabled && (
          <>
            <div className="divider" />

            <div className="row field-row">
              <label className="row-label" htmlFor="forward-to">
                <span className="label">Forward to</span>
                <span className="hint">Incoming mail will be sent to this address</span>
              </label>
              <input
                id="forward-to"
                type="email"
                className="email-input"
                placeholder="you@example.com"
                value={forwardTo}
                onChange={e => setForwardTo(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="divider" />

            <div className="row toggle-row">
              <div className="row-label">
                <span className="label">Keep a copy in my mailbox</span>
                <span className="hint">Store a copy even after forwarding</span>
              </div>
              <button
                type="button"
                className={`toggle ${keepCopy ? 'on' : 'off'}`}
                onClick={() => setKeepCopy(v => !v)}
                role="switch"
                aria-checked={keepCopy}
              >
                <span className="thumb" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="actions">
        {error && <span className="error-msg">{error}</span>}
        {saved && <span className="success-msg">Settings saved</span>}
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </div>
  )
}
