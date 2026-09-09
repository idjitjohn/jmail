'use client'

import Avatar from '../Avatar'
import Spinner from '../Spinner'
import MailActionMenu from '../MailActionMenu'
import { useMailViewerMessage } from './useMailViewerMessage'
import type { MailMessage } from '@/lib/types'
import type { PreviewFile } from '../AttachmentPreview/types'
import './MailViewerMessage.scss'

type Props = {
  message: MailMessage
  full?: MailMessage
  error?: string
  onRetry: () => void
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onCompose: (
    message: MailMessage,
    mode: 'reply' | 'all' | 'forward' | 'draft',
  ) => void
  onShowImages: (message: MailMessage) => void
  onPreview: (file: PreviewFile) => void
}

const MailViewerMessage = ({
  message,
  full,
  error,
  onRetry,
  expanded,
  busy,
  onToggle,
  onCompose,
  onShowImages,
  onPreview,
}: Props) => {
  const {
    contentId,
    fullDateLabel,
    dateLabel,
    timeLabel,
    t,
    recipientsLabel,
    remainingRecipients,
    recipientGroups,
    originalColors,
    contentRef,
    recipientsRef,
    overflowing,
    attachments,
    plural,
    details,
    showReplyAll,
    utilities,
  } = useMailViewerMessage(message, full, expanded)

  return (
    <article
      className={`MailViewerMessage ${expanded ? 'expanded' : 'collapsed'}`}
    >
      <button
        className="message-header"
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={expanded ? contentId : undefined}
      >
        <Avatar
          name={message.from.name}
          email={message.from.address}
          size="md"
        />
        <span className="sender">
          <span className="sender-name">
            {message.from.name || message.from.address}
          </span>
          <span className="sender-caption">
            {expanded ? message.from.address : message.preview}
          </span>
        </span>
        <time
          className="message-date"
          dateTime={message.date}
          title={fullDateLabel}
        >
          <span>{dateLabel}</span>
          {expanded && <span className="time">{timeLabel}</span>}
        </time>
      </button>

      {expanded && (
        <div className="message-body" id={contentId}>
          <details className="recipients" ref={recipientsRef}>
            <summary aria-label={t('Message details')}>
              <span className="recipient-summary">
                <span className="to-label">{t('To:')}</span> {recipientsLabel}
                {remainingRecipients > 0 && (
                  <span className="recipient-count">
                    +{remainingRecipients}
                  </span>
                )}
              </span>
            </summary>
            <dl className="recipient-details">
              {recipientGroups.map((group) => (
                <div className="detail-row" key={group.label}>
                  <dt>{t(group.label)}</dt>
                  <dd>{group.value}</dd>
                </div>
              ))}
              <div className="detail-row">
                <dt>{t('Date:')}</dt>
                <dd>{fullDateLabel}</dd>
              </div>
            </dl>
          </details>

          {full?.remoteImagesBlocked && (
            <div className="image-notice">
              <p>{t('Remote images are hidden to protect your privacy.')}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => onShowImages(full)}
              >
                {t('Show images')}
              </button>
            </div>
          )}

          <div
            className={`message-content${originalColors ? ' original-colors' : ''}`}
            ref={contentRef}
            role="region"
            aria-label={t('Message body')}
            tabIndex={overflowing ? 0 : undefined}
            data-swipe-ignore={overflowing || undefined}
          >
            {error ? (
              <div className="load-error" role="alert">
                <p>{t(error)}</p>
                <button type="button" onClick={onRetry}>
                  {t('Try again')}
                </button>
              </div>
            ) : full ? (
              full.html ? (
                <div
                  className="html-content"
                  dangerouslySetInnerHTML={{ __html: full.html }}
                />
              ) : (
                <pre className="text-content">
                  {full.text || t('This message has no text content.')}
                </pre>
              )
            ) : (
              <div
                className="loading-inline"
                role="status"
                aria-label={t('Loading message…')}
              >
                <Spinner size="sm" />
              </div>
            )}
          </div>
          {overflowing && (
            <p className="overflow-hint">
              {t('Scroll horizontally to see the full message.')}
            </p>
          )}

          {attachments.length > 0 && (
            <section className="attachments" aria-label={t('Attachments')}>
              <h2>
                {plural(
                  '{count} attachment',
                  '{count} attachments',
                  attachments.length,
                )}
              </h2>
              <ul className="attachment-list">
                {attachments.map((attachment) => (
                  <li
                    className={`attachment ${attachment.kind}`}
                    key={attachment.partId}
                  >
                    <button
                      className="preview"
                      type="button"
                      onClick={() =>
                        onPreview({
                          ...attachment,
                          uid: message.uid,
                          folder: message.folder,
                        })
                      }
                      aria-label={t('Preview {filename}', {
                        filename: attachment.filename,
                      })}
                    >
                      <span className="file-type">{attachment.extension}</span>
                      <span className="file-info">
                        <span className="file-name" title={attachment.filename}>
                          {attachment.filename}
                        </span>
                        <span className="file-size">
                          {attachment.sizeLabel}{' '}
                          <span className="preview-label">
                            · {t('Preview')}
                          </span>
                        </span>
                      </span>
                    </button>
                    <a
                      className="download"
                      href={attachment.downloadUrl}
                      download={attachment.filename}
                      aria-label={t('Download {filename}', {
                        filename: attachment.filename,
                      })}
                      title={t('Download')}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="message-actions">
            <div className="reply-actions">
              <button
                className={`reply primary${details.isDraft ? ' draft' : ''}`}
                type="button"
                disabled={busy || !full}
                onClick={() =>
                  onCompose(
                    full || message,
                    details.isDraft ? 'draft' : 'reply',
                  )
                }
              >
                {details.isDraft ? t('Edit draft') : t('Reply')}
              </button>
              {showReplyAll && (
                <button
                  className="reply-all"
                  type="button"
                  disabled={busy || !full}
                  onClick={() => onCompose(full || message, 'all')}
                >
                  {t('Reply all')}
                </button>
              )}
              {!details.isDraft && (
                <button
                  className="forward"
                  type="button"
                  disabled={busy || !full}
                  onClick={() => onCompose(full || message, 'forward')}
                >
                  {t('Forward')}
                </button>
              )}
            </div>
            <MailActionMenu
              actions={utilities}
              label="More message actions"
              placement="above"
            />
          </footer>
        </div>
      )}
    </article>
  )
}

export default MailViewerMessage
