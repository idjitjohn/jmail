'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useVacationSettings } from './useVacationSettings'
import './VacationSettings.scss'

export default function VacationSettings() {
  const {
    enabled, setEnabled,
    subject, setSubject,
    message, setMessage,
    days, setDays,
    loading, saving, saved, error, save,
  } = useVacationSettings()

  if (loading) {
    return (
      <div className="VacationSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="VacationSettings">
      <div className="section-header">
        <h1 className="title">Vacation auto-reply</h1>
        <p className="subtitle">Automatically reply to incoming messages while you are away</p>
      </div>

      <div className="card">
        <div className="row toggle-row">
          <div className="row-label">
            <span className="label">Enable auto-reply</span>
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

            <div className="fields">
              <div className="field">
                <label className="field-label" htmlFor="vacation-subject">Subject</label>
                <input
                  id="vacation-subject"
                  type="text"
                  className="text-input"
                  placeholder="Out of Office"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vacation-message">Message</label>
                <textarea
                  id="vacation-message"
                  className="text-area"
                  placeholder={"Thank you for your message.\nI'm currently away and will reply when I return."}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="field days-field">
                <label className="field-label" htmlFor="vacation-days">
                  Reply interval (days)
                </label>
                <input
                  id="vacation-days"
                  type="number"
                  className="text-input days-input"
                  min={1}
                  max={30}
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                />
                <span className="days-hint">Same sender won't receive more than one reply per interval</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="actions">
        {error && <span className="error-msg">{error}</span>}
        {saved && <span className="success-msg">Settings saved</span>}
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </div>
  )
}
