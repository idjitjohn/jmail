'use client'

import { useState, useEffect } from 'react'
import Input from '../Input'
import Button from '../Button'
import type { Signature } from '@/lib/signatures'
import './SignatureEditor.scss'

interface Props {
  initial?: Signature | null
  onSave: (name: string, html: string) => void
  onCancel: () => void
}

const PLACEHOLDER = `<p>Best regards,<br><strong>Your Name</strong><br><em>your@email.com</em></p>`

export default function SignatureEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [html, setHtml] = useState(initial?.html ?? PLACEHOLDER)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(initial?.name ?? '')
    setHtml(initial?.html ?? PLACEHOLDER)
    setError('')
  }, [initial])

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (!html.trim()) { setError('HTML is required'); return }
    onSave(name.trim(), html.trim())
  }

  return (
    <div className="SignatureEditor">
      <Input
        label="Signature name"
        placeholder="e.g. Work, Personal…"
        value={name}
        onChange={e => setName(e.target.value)}
        error={error && !name.trim() ? error : undefined}
        autoFocus
      />

      <div className="editor-area">
        <div className="editor-panel">
          <p className="panel-label">HTML code</p>
          <textarea
            className="code-input"
            value={html}
            onChange={e => setHtml(e.target.value)}
            spellCheck={false}
            rows={10}
          />
        </div>

        <div className="preview-panel">
          <p className="panel-label">Preview</p>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {error && html.trim() === '' && <p className="form-error">{error}</p>}

      <div className="editor-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>
          {initial ? 'Save changes' : 'Create signature'}
        </Button>
      </div>
    </div>
  )
}
