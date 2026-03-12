'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useSignatureSettings } from './useSignatureSettings'
import './SignatureSettings.scss'

export default function SignatureSettings() {
  const { signature, setSignature, loading, saving, saved, error, save } = useSignatureSettings()

  if (loading) {
    return (
      <div className="SignatureSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="SignatureSettings">
      <div className="section-header">
        <h1 className="title">Signature</h1>
        <p className="subtitle">Automatically appended to new messages</p>
      </div>

      <div className="card">
        <textarea
          className="editor"
          placeholder={"Best regards,\nYour Name"}
          value={signature}
          onChange={e => setSignature(e.target.value)}
          rows={6}
        />
        {signature && (
          <div className="preview">
            <span className="preview-label">Preview</span>
            <pre className="preview-text">{signature}</pre>
          </div>
        )}
      </div>

      <div className="actions">
        {error && <span className="error-msg">{error}</span>}
        {saved && <span className="success-msg">Signature saved</span>}
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </div>
  )
}
