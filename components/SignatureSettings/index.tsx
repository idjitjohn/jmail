'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import Spinner from '../Spinner'
import { useSignatureSettings } from './useSignatureSettings'
import './SignatureSettings.scss'

const SignatureSettings = () => {
  const { t } = useLocale()

  const {
    signature,
    setSignature,
    loading,
    saving,
    saved,
    error,
    ready,
    reload,
    save,
  } = useSignatureSettings()

  if (loading) {
    return (
      <div className="SignatureSettings">
        <div className="loading">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="SignatureSettings">
      <div className="section-header">
        <h1 className="title">{t('Signature')}</h1>
        <p className="subtitle">
          {t('Automatically appended to new messages')}
        </p>
      </div>

      <div className="card">
        <textarea
          className="editor"
          placeholder={t('Best regards,\nYour Name')}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          rows={6}
        />
        {signature && (
          <div className="preview">
            <span className="preview-label">{t('Preview')}</span>
            <pre className="preview-text">{signature}</pre>
          </div>
        )}
      </div>

      <div className="actions">
        {error && (
          <span className="error-msg" role="alert">
            {t(error)}
          </span>
        )}
        {!ready && (
          <Button variant="secondary" onClick={reload}>
            {t('Reload settings')}
          </Button>
        )}
        {saved && <span className="success-msg">{t('Signature saved')}</span>}
        <Button onClick={save} loading={saving} disabled={!ready}>
          {t('Save')}
        </Button>
      </div>
    </div>
  )
}

export default SignatureSettings
