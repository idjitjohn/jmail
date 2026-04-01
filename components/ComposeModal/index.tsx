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
            <button className="close-btn" onClick={onClose} type="button" aria-label="Close" />
          </div>

          {draftBanner && (
            <div className="draft-banner">
              <span>Draft restored</span>
              <button type="button" className="draft-dismiss" onClick={dismissDraftBanner} aria-label="Dismiss" />
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
                    <span className="file-icon" />
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => removeAttachment(i)}
                      aria-label="Remove"
                    />
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
                aria-label="Attach files"
              />
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
                aria-label="Schedule send"
              />
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
