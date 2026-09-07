'use client'

import Input from '../Input'
import Button from '../Button'
import RichEditor from '../RichEditor'
import SignaturePicker from '../SignaturePicker'
import SignatureManager from '../SignatureManager'
import ReplyTemplates from '../ReplyTemplates'
import { formatBytes } from '@/lib/format'
import { useComposeModal } from './useComposeModal'
import './ComposeModal.scss'

type Props = {
  isOpen: boolean
  userEmail: string
  onSent?: (message: string) => void
  onClose: () => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  inReplyTo?: string
}

const ComposeModal = ({
  isOpen,
  userEmail,
  onSent,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  inReplyTo,
}: Props) => {
  const {
    to,
    setTo,
    cc,
    setCc,
    subject,
    setSubject,
    bodyHtml,
    setBodyHtml,
    resetToken,
    signatureId,
    signatureHtml,
    handleSignatureChange,
    showCc,
    setShowCc,
    sending,
    scheduling,
    error,
    attachments,
    addAttachments,
    removeAttachment,
    draftBanner,
    dismissDraftBanner,
    showSchedule,
    setShowSchedule,
    scheduleAt,
    setScheduleAt,
    handleSend,
    handleSchedule,
    handleClose,
    discardDraft,
    draftStatus,
    templatesOpen,
    setTemplatesOpen,
    insertTemplate,
    sigManagerOpen,
    setSigManagerOpen,
    fileInputRef,
    panelRef,
    countdown,
    undoSend,
    busy,
    attachmentWarning,
    sendWithoutAttachment,
    dismissAttachmentWarning,
    minSchedule,
    presets,
  } = useComposeModal({
    isOpen,
    userEmail,
    onClose,
    onSent,
    to: initialTo,
    subject: initialSubject,
    body: initialBody,
    inReplyTo,
  })

  if (!isOpen) return null

  return (
    <>
      <div
        className="ComposeModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
      >
        <div className="backdrop" onClick={handleClose} />
        <div className="panel" ref={panelRef}>
          <div className="panel-header">
            <h2 className="title" id="compose-title">
              {inReplyTo ? 'Your reply' : 'New message'}
            </h2>
            <button
              className="close-btn"
              disabled={sending || scheduling}
              onClick={handleClose}
              type="button"
              aria-label="Close"
            />
          </div>

          {draftBanner && (
            <div className="draft-banner">
              <span>Draft restored</span>
              <button
                type="button"
                className="draft-dismiss"
                onClick={dismissDraftBanner}
                aria-label="Dismiss"
              />
            </div>
          )}

          <div className="fields" inert={busy}>
            <div className="field-row">
              <Input
                label="To"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                autoFocus
              />
              {!showCc && (
                <button
                  className="cc-toggle"
                  onClick={() => setShowCc(true)}
                  type="button"
                >
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
                onChange={(e) => setCc(e.target.value)}
              />
            )}

            <Input
              label="Subject"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="writing-tools">
              <button
                type="button"
                className={`template-toggle${templatesOpen ? ' active' : ''}`}
                aria-expanded={templatesOpen}
                onClick={() => setTemplatesOpen((open) => !open)}
              >
                Reply templates
              </button>
              <span className="writing-hint">
                A head start on the right words
              </span>
            </div>
            {templatesOpen && (
              <ReplyTemplates
                onInsert={insertTemplate}
                onClose={() => setTemplatesOpen(false)}
              />
            )}

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
            <div className="schedule-row" inert={busy}>
              <div className="presets">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setScheduleAt(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="schedule-label" htmlFor="schedule-time">
                Send at
              </label>
              <input
                id="schedule-time"
                type="datetime-local"
                className="schedule-input"
                value={scheduleAt}
                min={minSchedule}
                onChange={(e) => setScheduleAt(e.target.value)}
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

          {attachmentWarning && (
            <div className="attachment-warning" role="alert">
              <p>You mentioned an attachment. Add a file before sending?</p>
              <div className="warning-actions">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add attachment
                </button>
                <button type="button" onClick={sendWithoutAttachment}>
                  Send without it
                </button>
                <button type="button" onClick={dismissAttachmentWarning}>
                  Keep editing
                </button>
              </div>
            </div>
          )}
          {countdown !== null && (
            <div className="undo-banner" role="status">
              <div className="undo-copy">
                <strong>Sending in {countdown}s</strong>
                <span>A moment to catch that last little thing.</span>
              </div>
              <button type="button" onClick={undoSend}>
                Undo send
              </button>
            </div>
          )}
          {error && (
            <p className="send-error" role="alert">
              {error}
            </p>
          )}
          <div className="draft-status" role="status">
            {draftStatus}
            {attachments.length > 0
              ? ' · Reattach files if you close this draft'
              : ''}
          </div>

          <div className="panel-footer" inert={busy}>
            <div className="footer-left">
              <button
                type="button"
                className="discard-btn"
                aria-label="Discard draft"
                title="Discard draft"
                onClick={discardDraft}
              />
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
                onChange={(e) => addAttachments(e.target.files)}
              />
              <SignaturePicker
                value={signatureId}
                onChange={handleSignatureChange}
                onManage={() => setSigManagerOpen(true)}
              />
            </div>
            <div className="footer-actions">
              <Button variant="secondary" onClick={handleClose}>
                Save & close
              </Button>
              <button
                type="button"
                className={`schedule-toggle ${showSchedule ? 'active' : ''}`}
                onClick={() => setShowSchedule((s) => !s)}
                title="Schedule send"
                aria-label="Schedule send"
              />
              <Button onClick={handleSend} loading={sending}>
                Send
              </Button>
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

export default ComposeModal
