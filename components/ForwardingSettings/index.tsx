'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import Spinner from '../Spinner'
import { useForwardingSettings } from './useForwardingSettings'
import './ForwardingSettings.scss'

const ForwardingSettings = () => {
  const { t } = useLocale()

  const {
    enabled,
    setEnabled,
    forwardTo,
    setForwardTo,
    keepCopy,
    setKeepCopy,
    loading,
    saving,
    saved,
    error,
    ready,
    reload,
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
          <h1 className="title">{t('Forwarding')}</h1>
          <p className="subtitle">
            {t('Automatically forward incoming mail to another address')}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="row toggle-row">
          <div className="row-label">
            <span className="label">{t('Enable forwarding')}</span>
          </div>
          <button
            type="button"
            className={`toggle ${enabled ? 'on' : 'off'}`}
            onClick={() => setEnabled((v) => !v)}
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
                <span className="label">{t('Forward to')}</span>
                <span className="hint">
                  {t('Incoming mail will be sent to this address')}
                </span>
              </label>
              <input
                id="forward-to"
                type="email"
                className="email-input"
                placeholder={t('you@example.com')}
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="divider" />

            <div className="row toggle-row">
              <div className="row-label">
                <span className="label">{t('Keep a copy in my mailbox')}</span>
                <span className="hint">
                  {t('Store a copy even after forwarding')}
                </span>
              </div>
              <button
                type="button"
                className={`toggle ${keepCopy ? 'on' : 'off'}`}
                onClick={() => setKeepCopy((v) => !v)}
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
        {error && <span className="error-msg">{t(error)}</span>}
        {saved && <span className="success-msg">{t('Settings saved')}</span>}
        {!ready && <Button onClick={reload}>{t('Reload settings')}</Button>}
        <Button onClick={save} loading={saving} disabled={!ready}>
          {t('Save')}
        </Button>
      </div>
    </div>
  )
}

export default ForwardingSettings
