'use client'

import { useEffect, useRef, useState } from 'react'
import Input from '../Input'
import Button from '../Button'
import RichEditor from '../RichEditor'
import SignaturePicker from '../SignaturePicker'
import SignatureManager from '../SignatureManager'
import { formatBytes } from '@/lib/format'
import { useComposeModal } from './useComposeModal'
import './ComposeModal.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  inReplyTo?: string
}

export default function ComposeModal({
  isOpen,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  inReplyTo,
}: Props) {
  const {
    to, setTo,
    cc, setCc,
    subject, setSubject,
    bodyHtml, setBodyHtml,
    resetToken,
    signatureId, signatureHtml,
    handleSignatureChange,
    showCc, setShowCc,
    sending, scheduling, error,
    attachments, addAttachments, removeAttachment,
    draftBanner, dismissDraftBanner,
    showSchedule, setShowSchedule,
    scheduleAt, setScheduleAt,
    handleSend, handleSchedule,
    init,
  } = useComposeModal(onClose)

  const [sigManagerOpen, setSigManagerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      init({ to: initialTo, subject: initialSubject, body: initialBody, inReplyTo })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const minSchedule = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <>
      <div className="ComposeModal" role="dialog" aria-modal="true">
        <div className="backdrop" onClick={onClose} />
        <div className="panel">
          <div className="panel-header">
            <h2 className="title">New Message</h2>
            <button className="close-btn" onClick={onClose} type="button" aria-label="Close">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
              </svg>
            </button>
          </div>

          {draftBanner && (
            <div className="draft-banner">
              <span>Draft restored</span>
              <button type="button" className="draft-dismiss" onClick={dismissDraftBanner}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </button>
            </div>
          )}

          <div className="fields">
            <div className="field-row">
              <Input
                label="To"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={e => setTo(e.target.value)}
                autoFocus
              />
              {!showCc && (
                <button className="cc-toggle" onClick={() => setShowCc(true)} type="button">
                  Cc
                </button>
              )}
            </div>

            {showCc && (
              <Input
                label="Cc"
                type="text"
                placeholder="cc@example.com"
                value={cc}
                onChange={e => setCc(e.target.value)}
              />
            )}

            <Input
              label="Subject"
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />

            <RichEditor
              defaultValue={bodyHtml}
              resetToken={resetToken}
              onChange={setBodyHtml}
              placeholder="Write your message..."
            />

            {signatureHtml && (
              <div className="sig-preview">
                <p className="sig-preview-label">Signature</p>
                <div
                  className="sig-preview-content"
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                />
              </div>
            )}

            {attachments.length > 0 && (
              <ul className="attachment-list">
                {attachments.map((f, i) => (
                  <li key={i} className="attachment-item">
                    <svg className="file-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2z" />
                    </svg>
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => removeAttachment(i)}
                      aria-label="Remove"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showSchedule && (
            <div className="schedule-row">
              <label className="schedule-label">Send at</label>
              <input
                type="datetime-local"
                className="schedule-input"
                value={scheduleAt}
                min={minSchedule}
                onChange={e => setScheduleAt(e.target.value)}
              />
              <Button onClick={handleSchedule} loading={scheduling}>
                Schedule
              </Button>
              <button
                type="button"
                className="schedule-cancel"
                onClick={() => setShowSchedule(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {error && <p className="send-error">{error}</p>}

          <div className="panel-footer">
            <div className="footer-left">
              <button
                type="button"
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="file-input"
                onChange={e => addAttachments(e.target.files)}
              />
              <SignaturePicker
                value={signatureId}
                onChange={handleSignatureChange}
                onManage={() => setSigManagerOpen(true)}
              />
            </div>
            <div className="footer-actions">
              <Button variant="secondary" onClick={onClose}>Discard</Button>
              <button
                type="button"
                className={`schedule-toggle ${showSchedule ? 'active' : ''}`}
                onClick={() => setShowSchedule(s => !s)}
                title="Schedule send"
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
                </svg>
              </button>
              <Button onClick={handleSend} loading={sending}>Send</Button>
            </div>
          </div>
        </div>
      </div>

      <SignatureManager
        isOpen={sigManagerOpen}
        onClose={() => setSigManagerOpen(false)}
      />
    </>
  )
}
