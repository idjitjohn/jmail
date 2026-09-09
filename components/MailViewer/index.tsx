'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Avatar from '../Avatar'
import LaterDialog from '../LaterDialog'
import AttachmentPreview from '../AttachmentPreview'
import Spinner from '../Spinner'
import Toolbar from '../Toolbar'
import { useMailViewer } from './useMailViewer'
import { formatAddress } from '@/lib/format'
import type { ComposeState } from '../AppLayout/types'
import type { MailThread, MailAttachment } from '@/lib/types'
import './MailViewer.scss'

type Props = {
  userEmail?: string
  thread: MailThread | null
  folder: string
  onReply: (data: ComposeState) => void
  onDelete: () => void
  onUpdate?: () => void
  onMobileBack?: () => void
}

const MailViewer = ({
  userEmail,
  thread,
  folder,
  onReply,
  onDelete,
  onMobileBack,
  onUpdate,
}: Props) => {
  const { t, plural, formatDate, formatFullDate, formatBytes } = useLocale()

  const {
    laterMode,
    setLaterMode,
    latest,
    laterSaved,
    previewFile,
    setPreviewFile,
    expanded,
    fullMessages,
    loading,
    error,
    toggleExpand,
    toolbarActions,
    actionError,
    composeMessage,
    showImages,
    busy,
  } = useMailViewer(thread, folder, onReply, onDelete, onUpdate, userEmail)

  if (!thread) {
    return (
      <div className="MailViewer empty">
        <div className="placeholder">
          <p className="eyebrow">
            {t('A little less inbox. A little more focus.')}
          </p>
          <h2>{t('Make room for what matters.')}</h2>
          <p>
            {t('Choose a conversation to get started.')}
            <br />
            {t('We’ll keep the everyday things simple.')}
          </p>
          <div className="shortcut-hints">
            <span>
              <kbd>C</kbd> {t('Compose')}
            </span>
            <span>
              <kbd>/</kbd> {t('Search')}
            </span>
            <span>
              <kbd>?</kbd> {t('Commands')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="MailViewer">
      <div className="mobile-nav">
        <button
          className="mobile-back"
          onClick={onMobileBack}
          type="button"
          aria-label={t('Back')}
        >
          {t('Back')}
        </button>
      </div>

      {laterMode && latest && (
        <LaterDialog
          message={latest}
          mode={laterMode}
          onClose={() => setLaterMode(null)}
          onSaved={laterSaved}
        />
      )}
      {previewFile && (
        <AttachmentPreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
      <Toolbar actions={toolbarActions} />
      {actionError && (
        <p className="action-error" role="alert">
          {t(actionError)}
        </p>
      )}

      <div className="body">
        {loading ? (
          <div className="loading">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="error">
            <p>{t(error)}</p>
          </div>
        ) : (
          <>
            <h1 className="thread-subject">
              {thread.subject || t('(no subject)')}
            </h1>

            <div className="thread-messages">
              {thread.messages.map((msg) => {
                const full = fullMessages.get(msg.uid)
                const isExpanded = expanded.has(msg.uid)

                return (
                  <div
                    key={msg.uid}
                    className={`thread-item${isExpanded ? ' expanded' : ''}`}
                  >
                    <button
                      className="item-header"
                      onClick={() => toggleExpand(msg.uid)}
                      type="button"
                    >
                      <Avatar
                        name={msg.from.name}
                        email={msg.from.address}
                        size="sm"
                      />
                      <div className="item-meta">
                        <span className="item-sender">
                          {msg.from.name || msg.from.address}
                        </span>
                        {!isExpanded && msg.preview && (
                          <span className="item-preview">{msg.preview}</span>
                        )}
                      </div>
                      <time className="item-date">
                        {isExpanded
                          ? formatFullDate(msg.date)
                          : formatDate(msg.date)}
                      </time>
                    </button>

                    {isExpanded && (
                      <div className="item-body">
                        <div className="item-recipients">
                          <span className="to-label">{t('To:')}</span>
                          <span className="to-list">
                            {(full?.to || msg.to).map(formatAddress).join(', ')}
                          </span>
                          {full?.cc && full.cc.length > 0 && (
                            <>
                              <span className="to-label">{t('Cc:')}</span>
                              <span className="to-list">
                                {full.cc.map(formatAddress).join(', ')}
                              </span>
                            </>
                          )}
                        </div>

                        {full?.remoteImagesBlocked && (
                          <div className="image-notice">
                            <span>
                              {t(
                                'Remote images are hidden to protect your privacy.',
                              )}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => showImages(full)}
                            >
                              {t('Show images')}
                            </button>
                          </div>
                        )}
                        <div className="item-content">
                          {full ? (
                            full.html ? (
                              <div
                                className="html-content"
                                dangerouslySetInnerHTML={{ __html: full.html }}
                              />
                            ) : (
                              <pre className="text-content">{full.text}</pre>
                            )
                          ) : (
                            <div className="loading-inline">
                              <Spinner size="sm" />
                            </div>
                          )}
                        </div>

                        {full?.attachments && full.attachments.length > 0 && (
                          <div className="item-attachments">
                            <span className="attachments-label">
                              {plural(
                                '{count} attachment',
                                '{count} attachments',
                                full.attachments.length,
                              )}
                            </span>
                            <ul className="attachments-list">
                              {full.attachments.map((att: MailAttachment) => (
                                <li
                                  key={att.partId}
                                  className="attachment-chip"
                                >
                                  <a
                                    href={`/api/messages/${msg.uid}/attachments/${att.partId}?folder=${encodeURIComponent(folder)}`}
                                    download={att.filename}
                                    className="attachment-link"
                                  >
                                    <span className="attachment-icon" />
                                    <span className="attachment-name">
                                      {att.filename}
                                    </span>
                                    <span className="attachment-size">
                                      {formatBytes(att.size)}
                                    </span>
                                  </a>
                                  <button
                                    type="button"
                                    className="preview-attachment"
                                    onClick={() =>
                                      setPreviewFile({
                                        ...att,
                                        uid: msg.uid,
                                        folder: msg.folder,
                                      })
                                    }
                                  >
                                    {t('Preview')}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="item-actions">
                          <a
                            href={`/api/messages/${msg.uid}/source?folder=${encodeURIComponent(msg.folder)}`}
                            download
                          >
                            {t('Export .eml')}
                          </a>
                          <button type="button" onClick={() => window.print()}>
                            {t('Print')}
                          </button>
                          <button
                            type="button"
                            disabled={busy || !full}
                            onClick={() => composeMessage(full || msg, 'all')}
                          >
                            {t('Reply all')}
                          </button>
                          <button
                            className="reply-btn"
                            type="button"
                            disabled={busy || !full}
                            onClick={() =>
                              composeMessage(
                                full || msg,
                                full?.isDraft ? 'draft' : 'reply',
                              )
                            }
                          >
                            {full?.isDraft ? t('Edit draft') : t('Reply')}
                          </button>
                          <button
                            className="forward-btn"
                            type="button"
                            disabled={busy || !full}
                            onClick={() =>
                              composeMessage(full || msg, 'forward')
                            }
                          >
                            {t('Forward')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MailViewer
