'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useProfileSettings } from './useProfileSettings'
import { usePasswordSettings } from '../PasswordSettings/usePasswordSettings'
import { useSignatureSettings } from '../SignatureSettings/useSignatureSettings'
import './ProfileSettings.scss'

export default function ProfileSettings() {
  const profile = useProfileSettings()
  const password = usePasswordSettings()
  const signature = useSignatureSettings()

  if (profile.loading || signature.loading) {
    return (
      <div className="ProfileSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="ProfileSettings">

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Profile</h2>
        </div>
        <div className="card">
          <div className="row">
            <span className="row-label">Name</span>
            <input
              className="row-input"
              value={profile.name}
              onChange={e => profile.setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>
        </div>
        <div className="section-footer">
          {profile.error && <span className="msg error">{profile.error}</span>}
          {profile.saved && <span className="msg success">Saved</span>}
          <Button onClick={profile.save} loading={profile.saving} size="sm">Save</Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Password</h2>
        </div>
        <div className="card">
          <div className="row">
            <span className="row-label">Current</span>
            <input
              className="row-input"
              type="password"
              value={password.current}
              onChange={e => password.setCurrent(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="divider" />
          <div className="row">
            <span className="row-label">New</span>
            <input
              className="row-input"
              type="password"
              value={password.next}
              onChange={e => password.setNext(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="divider" />
          <div className="row">
            <span className="row-label">Confirm</span>
            <input
              className="row-input"
              type="password"
              value={password.confirm}
              onChange={e => password.setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="section-footer">
          {password.error && <span className="msg error">{password.error}</span>}
          {password.saved && <span className="msg success">Updated</span>}
          <Button onClick={password.save} loading={password.saving} size="sm">Save</Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Signature</h2>
          <p className="section-subtitle">Appended to new messages</p>
        </div>
        <div className="card">
          <textarea
            className="textarea"
            value={signature.signature}
            onChange={e => signature.setSignature(e.target.value)}
            placeholder={"Best regards,\nYour Name"}
            rows={5}
          />
          {signature.signature && (
            <div className="preview">
              <span className="preview-label">Preview</span>
              <pre className="preview-text">{signature.signature}</pre>
            </div>
          )}
        </div>
        <div className="section-footer">
          {signature.error && <span className="msg error">{signature.error}</span>}
          {signature.saved && <span className="msg success">Saved</span>}
          <Button onClick={signature.save} loading={signature.saving} size="sm">Save</Button>
        </div>
      </section>

    </div>
  )
}
