'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import clsx from 'clsx'
import { useSignatureEditor } from './useSignatureEditor'
import Input from '../Input'
import Button from '../Button'
import type { Signature } from '@/lib/signatures'
import { TEMPLATES } from '@/lib/signatureTemplates'
import './SignatureEditor.scss'

type Props = {
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

const SignatureEditor = ({ initial, onSave, onCancel }: Props) => {
  const { t } = useLocale()

  const {
    sigName,
    setSigName,
    html,
    setHtml,
    tab,
    setTab,
    selectedTemplate,
    setSelectedTemplate,
    fields,
    nameError,
    setNameError,
    pickTemplate,
    setField,
    handleSave,
    previewHtml,
  } = useSignatureEditor(initial, onSave)

  return (
    <div className="SignatureEditor">
      <div className="editor-top">
        <Input
          label={t('Signature name')}
          placeholder={t('e.g. Work, Personal…')}
          value={sigName}
          onChange={(e) => {
            setSigName(e.target.value)
            setNameError('')
          }}
          error={nameError || undefined}
          autoFocus
        />
        <div className="tabs">
          <button
            className={clsx('tab', { active: tab === 'templates' })}
            onClick={() => setTab('templates')}
            type="button"
          >
            {t('Templates')}
          </button>
          <button
            className={clsx('tab', { active: tab === 'code' })}
            onClick={() => setTab('code')}
            type="button"
          >
            {t('HTML code')}
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* Left panel */}
        <div className="left-panel">
          {tab === 'templates' ? (
            <>
              <div className="template-grid">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    className={clsx('template-card', {
                      active: selectedTemplate?.id === tpl.id,
                    })}
                    onClick={() => pickTemplate(tpl)}
                    type="button"
                  >
                    <div
                      className="template-thumb"
                      dangerouslySetInnerHTML={{
                        __html: tpl.build({
                          name: 'Jane Doe',
                          title: 'Designer',
                          company: 'Acme',
                          email: 'jane@example.com',
                          phone: '+1 234 567',
                          color: tpl.defaultColor ?? '#007aff',
                        }),
                      }}
                    />
                    <span className="template-name">{t(tpl.name)}</span>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="fields-panel">
                  {FIELD_GROUPS.map((group) => {
                    const groupFields = selectedTemplate.fields.filter(
                      (f) => f.group === group.key,
                    )
                    if (!groupFields.length) return null
                    return (
                      <div key={group.key} className="field-group">
                        <p className="group-label">{t(group.label)}</p>
                        <div className="group-fields">
                          {groupFields.map((f) => (
                            <div key={f.key} className="field-item">
                              {f.type === 'color' ? (
                                <div className="color-row">
                                  <label className="color-label">
                                    {t(f.label)}
                                  </label>
                                  <div className="color-input-wrap">
                                    <input
                                      type="color"
                                      className="color-swatch"
                                      value={fields[f.key] || f.placeholder}
                                      onChange={(e) =>
                                        setField(f.key, e.target.value)
                                      }
                                    />
                                    <input
                                      type="text"
                                      className="color-text"
                                      value={fields[f.key] || ''}
                                      placeholder={
                                        f.placeholder
                                          ? t(f.placeholder)
                                          : undefined
                                      }
                                      onChange={(e) =>
                                        setField(f.key, e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <Input
                                  label={`${t(f.label)}${f.optional ? '' : ' *'}`}
                                  type={f.type ?? 'text'}
                                  placeholder={
                                    f.placeholder ? t(f.placeholder) : undefined
                                  }
                                  value={fields[f.key] || ''}
                                  onChange={(e) =>
                                    setField(f.key, e.target.value)
                                  }
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
                    {t('Edit HTML directly →')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <textarea
              className="code-input"
              value={html}
              onChange={(e) => {
                setHtml(e.target.value)
                setSelectedTemplate(null)
              }}
              spellCheck={false}
              placeholder={t('<p>Your signature HTML…</p>')}
            />
          )}
        </div>

        {/* Right panel: preview */}
        <div className="preview-panel">
          <p className="panel-label">{t('Preview')}</p>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <div className="editor-actions">
        <Button variant="secondary" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSave} disabled={!html.trim()}>
          {initial ? t('Save changes') : t('Create signature')}
        </Button>
      </div>
    </div>
  )
}

export default SignatureEditor
