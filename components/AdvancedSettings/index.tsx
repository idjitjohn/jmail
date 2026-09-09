'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import Spinner from '../Spinner'
import { useForwardingSettings } from '../ForwardingSettings/useForwardingSettings'
import { useVacationSettings } from '../VacationSettings/useVacationSettings'
import './AdvancedSettings.scss'

const AdvancedSettings = () => {
  const { t } = useLocale()

  const fwd = useForwardingSettings()
  const vac = useVacationSettings()

  if (fwd.loading || vac.loading) {
    return (
      <div className="AdvancedSettings">
        <div className="loading">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="AdvancedSettings">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Forwarding')}</h2>
          <p className="section-subtitle">
            {t('Automatically forward incoming mail to another address')}
          </p>
        </div>
        <div className="card">
          <div className="toggle-row">
            <span className="toggle-label">{t('Enable forwarding')}</span>
            <button
              type="button"
              className={`toggle ${fwd.enabled ? 'on' : 'off'}`}
              onClick={() => fwd.setEnabled((v) => !v)}
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
                <span className="field-label">{t('Forward to')}</span>
                <input
                  type="email"
                  className="field-input"
                  placeholder={t('you@example.com')}
                  value={fwd.forwardTo}
                  onChange={(e) => fwd.setForwardTo(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="divider" />
              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-label">
                    {t('Keep a copy in my mailbox')}
                  </span>
                  <span className="toggle-hint">
                    {t('Store a copy even after forwarding')}
                  </span>
                </div>
                <button
                  type="button"
                  className={`toggle ${fwd.keepCopy ? 'on' : 'off'}`}
                  onClick={() => fwd.setKeepCopy((v) => !v)}
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
          {fwd.error && (
            <span className="msg error" role="alert">
              {t(fwd.error)}
            </span>
          )}
          {!fwd.ready && (
            <Button variant="secondary" onClick={fwd.reload}>
              {t('Reload settings')}
            </Button>
          )}
          {fwd.saved && <span className="msg success">{t('Saved')}</span>}
          <Button
            onClick={fwd.save}
            loading={fwd.saving}
            disabled={!fwd.ready}
            size="sm"
          >
            {t('Save')}
          </Button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Vacation reply')}</h2>
          <p className="section-subtitle">
            {t('Automatically reply to incoming messages while you are away')}
          </p>
        </div>
        <div className="card">
          <div className="toggle-row">
            <span className="toggle-label">{t('Enable auto-reply')}</span>
            <button
              type="button"
              className={`toggle ${vac.enabled ? 'on' : 'off'}`}
              disabled={!vac.ready || !vac.available || vac.saving}
              aria-label={t('Enable automatic replies')}
              onClick={() => vac.setEnabled((v) => !v)}
              role="switch"
              aria-checked={vac.enabled}
            >
              <span className="thumb" />
            </button>
          </div>

          {!vac.available && (
            <p role="status">
              {t(
                'Automatic replies are not connected on this server. Contact your administrator.',
              )}
            </p>
          )}
          {vac.enabled && (
            <>
              <div className="divider" />
              <div className="fields">
                <div className="field">
                  <label className="field-label" htmlFor="vac-subject">
                    {t('Subject')}
                  </label>
                  <input
                    id="vac-subject"
                    className="field-input"
                    placeholder={t('Out of Office')}
                    value={vac.subject}
                    onChange={(e) => vac.setSubject(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="vac-message">
                    {t('Message')}
                  </label>
                  <textarea
                    id="vac-message"
                    className="field-textarea"
                    placeholder={t(
                      "Thank you for your message.\nI'm currently away and will reply when I return.",
                    )}
                    value={vac.message}
                    onChange={(e) => vac.setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="field days-field">
                  <label className="field-label" htmlFor="vac-days">
                    {t('Reply interval (days)')}
                  </label>
                  <input
                    id="vac-days"
                    type="number"
                    className="field-input days-input"
                    min={1}
                    max={30}
                    value={vac.days}
                    onChange={(e) => vac.setDays(Number(e.target.value))}
                  />
                  <span className="days-hint">
                    {t(
                      'Same sender won’t receive more than one reply per interval',
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="section-footer">
          {vac.error && (
            <span className="msg error" role="alert">
              {t(vac.error)}
            </span>
          )}
          {!vac.ready && (
            <Button variant="secondary" onClick={vac.reload}>
              {t('Reload settings')}
            </Button>
          )}
          {vac.saved && <span className="msg success">{t('Saved')}</span>}
          <Button
            onClick={vac.save}
            loading={vac.saving}
            disabled={!vac.ready || !vac.available}
            size="sm"
          >
            {t('Save')}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default AdvancedSettings
