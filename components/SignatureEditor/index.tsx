'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import Input from '../Input'
import Button from '../Button'
import type { Signature } from '@/lib/signatures'
import { TEMPLATES, type SignatureTemplate } from '@/lib/signatureTemplates'
import './SignatureEditor.scss'

interface Props {
  initial?: Signature | null
  onSave: (name: string, html: string) => void
  onCancel: () => void
}

const FIELD_GROUPS = [
  { key: 'identity', label: 'Identity' },
  { key: 'contact', label: 'Contact' },
  { key: 'social', label: 'Social networks' },
  { key: 'style', label: 'Style' },
] as const

type Tab = 'templates' | 'code'

export default function SignatureEditor({ initial, onSave, onCancel }: Props) {
  const [sigName, setSigName] = useState(initial?.name ?? '')
  const [html, setHtml] = useState(initial?.html ?? '')
  const [tab, setTab] = useState<Tab>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    setSigName(initial?.name ?? '')
    setHtml(initial?.html ?? '')
    setNameError('')
    setSelectedTemplate(null)
    setFields({})
    // If editing an existing signature, open on code tab
    if (initial?.html) setTab('code')
    else setTab('templates')
  }, [initial])

  const pickTemplate = (tpl: SignatureTemplate) => {
    setSelectedTemplate(tpl)
    const defaults: Record<string, string> = {}
    tpl.fields.forEach(f => {
      if (f.type === 'color') defaults[f.key] = tpl.defaultColor ?? '#007aff'
    })
    setFields(defaults)
    setHtml(tpl.build(defaults))
  }

  const setField = (key: string, value: string) => {
    const updated = { ...fields, [key]: value }
    setFields(updated)
    if (selectedTemplate) setHtml(selectedTemplate.build(updated))
  }

  const handleSave = () => {
    if (!sigName.trim()) { setNameError('Name is required'); return }
    if (!html.trim()) return
    onSave(sigName.trim(), html.trim())
  }

  const previewHtml = html || '<p style="color:#aeaeb2;font-family:sans-serif;font-size:13px">Preview will appear here</p>'

  return (
    <div className="SignatureEditor">
      <div className="editor-top">
        <Input
          label="Signature name"
          placeholder="e.g. Work, Personal…"
          value={sigName}
          onChange={e => { setSigName(e.target.value); setNameError('') }}
          error={nameError || undefined}
          autoFocus
        />
        <div className="tabs">
          <button
            className={clsx('tab', { active: tab === 'templates' })}
            onClick={() => setTab('templates')}
            type="button"
          >
            Templates
          </button>
          <button
            className={clsx('tab', { active: tab === 'code' })}
            onClick={() => setTab('code')}
            type="button"
          >
            HTML code
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* Left panel */}
        <div className="left-panel">
          {tab === 'templates' ? (
            <>
              <div className="template-grid">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    className={clsx('template-card', { active: selectedTemplate?.id === tpl.id })}
                    onClick={() => pickTemplate(tpl)}
                    type="button"
                  >
                    <div
                      className="template-thumb"
                      dangerouslySetInnerHTML={{ __html: tpl.build({
                        name: 'Jane Doe',
                        title: 'Designer',
                        company: 'Acme',
                        email: 'jane@example.com',
                        phone: '+1 234 567',
                        color: tpl.defaultColor ?? '#007aff',
                      }) }}
                    />
                    <span className="template-name">{tpl.name}</span>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="fields-panel">
                  {FIELD_GROUPS.map(group => {
                    const groupFields = selectedTemplate.fields.filter(f => f.group === group.key)
                    if (!groupFields.length) return null
                    return (
                      <div key={group.key} className="field-group">
                        <p className="group-label">{group.label}</p>
                        <div className="group-fields">
                          {groupFields.map(f => (
                            <div key={f.key} className="field-item">
                              {f.type === 'color' ? (
                                <div className="color-row">
                                  <label className="color-label">{f.label}</label>
                                  <div className="color-input-wrap">
                                    <input
                                      type="color"
                                      className="color-swatch"
                                      value={fields[f.key] || f.placeholder}
                                      onChange={e => setField(f.key, e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="color-text"
                                      value={fields[f.key] || ''}
                                      placeholder={f.placeholder}
                                      onChange={e => setField(f.key, e.target.value)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <Input
                                  label={`${f.label}${f.optional ? '' : ' *'}`}
                                  type={f.type ?? 'text'}
                                  placeholder={f.placeholder}
                                  value={fields[f.key] || ''}
                                  onChange={e => setField(f.key, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <button
                    className="to-code-btn"
                    onClick={() => setTab('code')}
                    type="button"
                  >
                    Edit HTML directly →
                  </button>
                </div>
              )}
            </>
          ) : (
            <textarea
              className="code-input"
              value={html}
              onChange={e => { setHtml(e.target.value); setSelectedTemplate(null) }}
              spellCheck={false}
              placeholder="<p>Your signature HTML…</p>"
            />
          )}
        </div>

        {/* Right panel: preview */}
        <div className="preview-panel">
          <p className="panel-label">Preview</p>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <div className="editor-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!html.trim()}>
          {initial ? 'Save changes' : 'Create signature'}
        </Button>
      </div>
    </div>
  )
}
