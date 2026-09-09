'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import Spinner from '../Spinner'
import { useProfileSettings } from './useProfileSettings'
import { usePasswordSettings } from '../PasswordSettings/usePasswordSettings'
import { useSignatureSettings } from '../SignatureSettings/useSignatureSettings'
import './ProfileSettings.scss'

const ProfileSettings = () => {
  const { t } = useLocale()

  const profile = useProfileSettings()
  const password = usePasswordSettings()
  const signature = useSignatureSettings()

  if (profile.loading || signature.loading) {
    return (
      <div className="ProfileSettings">
        <div className="loading">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="ProfileSettings">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Profile')}</h2>
        </div>
        <div className="card">
          <div className="row">
            <span className="row-label">{t('Name')}</span>
            <input
              className="row-input"
              value={profile.name}
              onChange={(e) => profile.setName(e.target.value)}
              placeholder={t('John Doe')}
              autoComplete="name"
            />
          </div>
        </div>
        <div className="section-footer">
          {profile.error && (
            <span className="msg error" role="alert">
              {t(profile.error)}
            </span>
          )}
          {!profile.ready && (
            <Button variant="secondary" onClick={profile.reload}>
              {t('Reload settings')}
            </Button>
          )}
          {profile.saved && <span className="msg success">{t('Saved')}</span>}
          <Button
            onClick={profile.save}
            loading={profile.saving}
            disabled={!profile.ready}
            size="sm"
          >
            {t('Save')}
          </Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Password')}</h2>
        </div>
        <div className="card">
          <div className="row">
            <span className="row-label">{t('Current')}</span>
            <input
              className="row-input"
              type="password"
              value={password.current}
              onChange={(e) => password.setCurrent(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="divider" />
          <div className="row">
            <span className="row-label">{t('New')}</span>
            <input
              className="row-input"
              type="password"
              value={password.next}
              onChange={(e) => password.setNext(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="divider" />
          <div className="row">
            <span className="row-label">{t('Confirm')}</span>
            <input
              className="row-input"
              type="password"
              value={password.confirm}
              onChange={(e) => password.setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="section-footer">
          {password.error && (
            <span className="msg error">{t(password.error)}</span>
          )}
          {password.saved && (
            <span className="msg success">{t('Updated')}</span>
          )}
          <Button onClick={password.save} loading={password.saving} size="sm">
            {t('Save')}
          </Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Signature')}</h2>
          <p className="section-subtitle">{t('Appended to new messages')}</p>
        </div>
        <div className="card">
          <textarea
            className="textarea"
            value={signature.signature}
            onChange={(e) => signature.setSignature(e.target.value)}
            placeholder={t('Best regards,\nYour Name')}
            rows={5}
          />
          {signature.signature && (
            <div className="preview">
              <span className="preview-label">{t('Preview')}</span>
              <pre className="preview-text">{signature.signature}</pre>
            </div>
          )}
        </div>
        <div className="section-footer">
          {signature.error && (
            <span className="msg error" role="alert">
              {t(signature.error)}
            </span>
          )}
          {!signature.ready && (
            <Button variant="secondary" onClick={signature.reload}>
              {t('Reload settings')}
            </Button>
          )}
          {signature.saved && <span className="msg success">{t('Saved')}</span>}
          <Button
            onClick={signature.save}
            loading={signature.saving}
            disabled={!signature.ready}
            size="sm"
          >
            {t('Save')}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default ProfileSettings
