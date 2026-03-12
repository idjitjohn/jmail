'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useForwardingSettings } from '../ForwardingSettings/useForwardingSettings'
import { useVacationSettings } from '../VacationSettings/useVacationSettings'
import './AdvancedSettings.scss'

export default function AdvancedSettings() {
  const fwd = useForwardingSettings()
  const vac = useVacationSettings()

  if (fwd.loading || vac.loading) {
    return (
      <div className="AdvancedSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="AdvancedSettings">

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Forwarding</h2>
          <p className="section-subtitle">Automatically forward incoming mail to another address</p>
        </div>
        <div className="card">
          <div className="toggle-row">
            <span className="toggle-label">Enable forwarding</span>
            <button
              type="button"
              className={`toggle ${fwd.enabled ? 'on' : 'off'}`}
              onClick={() => fwd.setEnabled(v => !v)}
              role="switch"
              aria-checked={fwd.enabled}
            >
              <span className="thumb" />
            </button>
          </div>

          {fwd.enabled && (
            <>
              <div className="divider" />
              <div className="field-row">
                <span className="field-label">Forward to</span>
                <input
                  type="email"
                  className="field-input"
                  placeholder="you@example.com"
                  value={fwd.forwardTo}
                  onChange={e => fwd.setForwardTo(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="divider" />
              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-label">Keep a copy in my mailbox</span>
                  <span className="toggle-hint">Store a copy even after forwarding</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${fwd.keepCopy ? 'on' : 'off'}`}
                  onClick={() => fwd.setKeepCopy(v => !v)}
                  role="switch"
                  aria-checked={fwd.keepCopy}
                >
                  <span className="thumb" />
                </button>
              </div>
            </>
          )}
        </div>
        <div className="section-footer">
          {fwd.error && <span className="msg error">{fwd.error}</span>}
          {fwd.saved && <span className="msg success">Saved</span>}
          <Button onClick={fwd.save} loading={fwd.saving} size="sm">Save</Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Vacation reply</h2>
          <p className="section-subtitle">Automatically reply to incoming messages while you are away</p>
        </div>
        <div className="card">
          <div className="toggle-row">
            <span className="toggle-label">Enable auto-reply</span>
            <button
              type="button"
              className={`toggle ${vac.enabled ? 'on' : 'off'}`}
              onClick={() => vac.setEnabled(v => !v)}
              role="switch"
              aria-checked={vac.enabled}
            >
              <span className="thumb" />
            </button>
          </div>

          {vac.enabled && (
            <>
              <div className="divider" />
              <div className="fields">
                <div className="field">
                  <label className="field-label" htmlFor="vac-subject">Subject</label>
                  <input
                    id="vac-subject"
                    className="field-input"
                    placeholder="Out of Office"
                    value={vac.subject}
                    onChange={e => vac.setSubject(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="vac-message">Message</label>
                  <textarea
                    id="vac-message"
                    className="field-textarea"
                    placeholder={"Thank you for your message.\nI'm currently away and will reply when I return."}
                    value={vac.message}
                    onChange={e => vac.setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="field days-field">
                  <label className="field-label" htmlFor="vac-days">Reply interval (days)</label>
                  <input
                    id="vac-days"
                    type="number"
                    className="field-input days-input"
                    min={1}
                    max={30}
                    value={vac.days}
                    onChange={e => vac.setDays(Number(e.target.value))}
                  />
                  <span className="days-hint">Same sender won't receive more than one reply per interval</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="section-footer">
          {vac.error && <span className="msg error">{vac.error}</span>}
          {vac.saved && <span className="msg success">Saved</span>}
          <Button onClick={vac.save} loading={vac.saving} size="sm">Save</Button>
        </div>
      </section>

    </div>
  )
}
