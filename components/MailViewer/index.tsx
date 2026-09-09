'use client'

import LaterDialog from '../LaterDialog'
import AttachmentPreview from '../AttachmentPreview'
import Spinner from '../Spinner'
import MailActionMenu from '../MailActionMenu'
import MailViewerMessage from '../MailViewerMessage'
import { useMailViewer } from './useMailViewer'
import type { ComposeState } from '../AppLayout/types'
import type { MailThread } from '@/lib/types'
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
  const {
    t,
    laterMode,
    latest,
    setLaterMode,
    laterSaved,
    previewFile,
    setPreviewFile,
    primaryActions,
    moreActions,
    actionError,
    bodyRef,
    loading,
    folderName,
    historyExpanded,
    toggleHistory,
    visibleMessages,
    plural,
    error,
    retry,
    fullMessages,
    messageErrors,
    retryMessage,
    expanded,
    busy,
    toggleExpand,
    composeMessage,
    showImages,
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
    <section className="MailViewer" aria-label={t('Conversation')}>
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
      <div
        className="viewer-toolbar"
        role="group"
        aria-label={t('Conversation actions')}
      >
        {onMobileBack && (
          <button
            className="mobile-back"
            onClick={onMobileBack}
            type="button"
            aria-label={t('Back')}
            title={t('Back')}
          />
        )}
        <div className="toolbar-actions">
          {primaryActions.map((action) => (
            <button
              key={action.id}
              className={`toolbar-action ${action.id}${action.active ? ' active' : ''}${action.danger ? ' danger' : ''}`}
              type="button"
              disabled={action.disabled}
              aria-label={t(action.label)}
              title={t(action.label)}
              aria-pressed={action.id === 'star' ? action.active : undefined}
              onClick={action.onClick}
            >
              <span className="action-label">{t(action.label)}</span>
            </button>
          ))}
          <MailActionMenu
            key={thread.id}
            actions={moreActions}
            label="More conversation actions"
          />
        </div>
      </div>
      {actionError && (
        <p className="action-error" role="alert">
          {t(actionError)}
        </p>
      )}
      <div className="body" ref={bodyRef} aria-busy={loading}>
        <header className="conversation-heading">
          <div className="conversation-context">
            <span className="folder-label">{folderName}</span>
            <span className="message-count">
              {plural(
                '{count} message',
                '{count} messages',
                thread.messages.length,
              )}
            </span>
          </div>
          <h1 className="thread-subject">
            {thread.subject || t('(no subject)')}
          </h1>
        </header>
        {loading ? (
          <div className="loading" role="status">
            <Spinner size="lg" />
            <span>{t('Loading message…')}</span>
          </div>
        ) : error ? (
          <div className="error" role="alert">
            <p>{t(error)}</p>
            <button type="button" onClick={retry}>
              {t('Try again')}
            </button>
          </div>
        ) : (
          <div className="thread-messages">
            {thread.messages.length > 1 && (
              <button
                className="history-toggle"
                type="button"
                aria-expanded={historyExpanded}
                onClick={toggleHistory}
              >
                {historyExpanded
                  ? t('Hide earlier messages')
                  : plural(
                      '{count} earlier message',
                      '{count} earlier messages',
                      thread.messages.length - 1,
                    )}
              </button>
            )}
            {visibleMessages.map((message) => (
              <MailViewerMessage
                key={`${message.folder}:${message.uid}`}
                message={message}
                full={fullMessages.get(message.uid)}
                error={messageErrors.get(message.uid)}
                onRetry={() => retryMessage(message.uid)}
                expanded={expanded.has(message.uid)}
                busy={busy}
                onToggle={() => toggleExpand(message.uid)}
                onCompose={composeMessage}
                onShowImages={showImages}
                onPreview={setPreviewFile}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MailViewer
