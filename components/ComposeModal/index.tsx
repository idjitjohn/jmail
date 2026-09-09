'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Input from '../Input'
import RecipientInput from '../RecipientInput'
import Button from '../Button'
import RichEditor from '../RichEditor'
import SignaturePicker from '../SignaturePicker'
import SignatureManager from '../SignatureManager'
import ReplyTemplates from '../ReplyTemplates'
import { useComposeModal } from './useComposeModal'
import './ComposeModal.scss'

type Props = {
  isOpen: boolean
  userEmail: string
  onSent?: (message: string) => void
  onClose: () => void
  initialCc?: string
  initialBcc?: string
  initialAttachments?: File[]
  draftUid?: number
  references?: string[]
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
  initialCc,
  initialBcc,
  initialAttachments,
  draftUid,
  references,
}: Props) => {
  const { t, plural, formatBytes } = useLocale()

  const {
    to,
    setTo,
    cc,
    setCc,
    bcc,
    setBcc,
    showBcc,
    setShowBcc,
    saving,
    confirmDiscard,
    setConfirmDiscard,
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
    cc: initialCc,
    bcc: initialBcc,
    attachments: initialAttachments,
    draftUid,
    references,
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
              {inReplyTo ? t('Your reply') : t('New message')}
            </h2>
            <button
              className="close-btn"
              disabled={sending || scheduling}
              onClick={handleClose}
              type="button"
              aria-label={t('Close')}
            />
          </div>

          {draftBanner && (
            <div className="draft-banner">
              <span>{t('Draft restored')}</span>
              <button
                type="button"
                className="draft-dismiss"
                onClick={dismissDraftBanner}
                aria-label={t('Dismiss')}
              />
            </div>
          )}

          <div className="fields" inert={busy}>
            <div className="field-row">
              <RecipientInput
                label={t('To')}
                value={to}
                onChange={setTo}
                autoFocus
              />
              {!showCc && (
                <button
                  className="cc-toggle"
                  onClick={() => setShowCc(true)}
                  type="button"
                >
                  {t('Cc')}
                </button>
              )}
              {!showBcc && (
                <button
                  className="cc-toggle"
                  type="button"
                  onClick={() => setShowBcc(true)}
                >
                  {t('Bcc')}
                </button>
              )}
            </div>

            {showCc && (
              <RecipientInput label={t('Cc')} value={cc} onChange={setCc} />
            )}
            {showBcc && (
              <RecipientInput label={t('Bcc')} value={bcc} onChange={setBcc} />
            )}

            <Input
              label={t('Subject')}
              placeholder={t('Subject')}
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
                {t('Reply templates')}
              </button>
              <span className="writing-hint">
                {t('A head start on the right words')}
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
              placeholder={t('Write your message...')}
            />

            {signatureHtml && (
              <div className="sig-preview">
                <p className="sig-preview-label">{t('Signature')}</p>
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
                      aria-label={t('Remove')}
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
                    {t(preset.label)}
                  </button>
                ))}
              </div>
              <label className="schedule-label" htmlFor="schedule-time">
                {t('Send at')}
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
                {t('Schedule')}
              </Button>
              <button
                type="button"
                className="schedule-cancel"
                onClick={() => setShowSchedule(false)}
              >
                {t('Cancel')}
              </button>
            </div>
          )}

          {attachmentWarning && (
            <div className="attachment-warning" role="alert">
              <p>
                {t('You mentioned an attachment. Add a file before sending?')}
              </p>
              <div className="warning-actions">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('Add attachment')}
                </button>
                <button type="button" onClick={sendWithoutAttachment}>
                  {t('Send without it')}
                </button>
                <button type="button" onClick={dismissAttachmentWarning}>
                  {t('Keep editing')}
                </button>
              </div>
            </div>
          )}
          {countdown !== null && (
            <div className="undo-banner" role="status">
              <div className="undo-copy">
                <strong>
                  {plural(
                    'Sending in {count} second',
                    'Sending in {count} seconds',
                    countdown ?? 0,
                  )}
                </strong>
                <span>{t('A moment to catch that last little thing.')}</span>
              </div>
              <button type="button" onClick={undoSend}>
                {t('Undo send')}
              </button>
            </div>
          )}
          {confirmDiscard && (
            <div className="attachment-warning" role="alert">
              <p>{t('Discard this draft and its attachments?')}</p>
              <div className="warning-actions">
                <button type="button" disabled={saving} onClick={discardDraft}>
                  {t('Discard draft')}
                </button>
                <button type="button" onClick={() => setConfirmDiscard(false)}>
                  {t('Keep editing')}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="send-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="draft-status" role="status">
            {t(draftStatus)}
          </div>

          <div className="panel-footer" inert={busy}>
            <div className="footer-left">
              <button
                type="button"
                className="discard-btn"
                aria-label={t('Discard draft')}
                title={t('Discard draft')}
                onClick={() => setConfirmDiscard(true)}
              />
              <button
                type="button"
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title={t('Attach files')}
                aria-label={t('Attach files')}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="file-input"
                onChange={(e) => addAttachments(e.target.files)}
              />
              <SignaturePicker
                userEmail={userEmail}
                value={signatureId}
                onChange={handleSignatureChange}
                onManage={() => setSigManagerOpen(true)}
              />
            </div>
            <div className="footer-actions">
              <Button
                variant="secondary"
                loading={saving}
                onClick={handleClose}
              >
                {t('Save & close')}
              </Button>
              <button
                type="button"
                className={`schedule-toggle ${showSchedule ? 'active' : ''}`}
                onClick={() => setShowSchedule((s) => !s)}
                title={t('Schedule send')}
                aria-label={t('Schedule send')}
              />
              <Button onClick={handleSend} loading={sending}>
                {t('Send')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SignatureManager
        userEmail={userEmail}
        isOpen={sigManagerOpen}
        onClose={() => setSigManagerOpen(false)}
      />
    </>
  )
}

export default ComposeModal
