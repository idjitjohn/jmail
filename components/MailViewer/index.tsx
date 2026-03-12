'use client'

import Avatar from '../Avatar'
import Spinner from '../Spinner'
import Toolbar from '../Toolbar'
import { useMailViewer } from './useMailViewer'
import { formatFullDate, formatDate, formatAddress, formatBytes } from '@/lib/format'
import type { MailThread, MailAttachment } from '@/lib/types'
import './MailViewer.scss'

interface Props {
  thread: MailThread | null
  folder: string
  onReply: (data: { to: string; subject: string; inReplyTo?: string }) => void
  onDelete: () => void
  onMobileBack?: () => void
}

export default function MailViewer({ thread, folder, onReply, onDelete, onMobileBack }: Props) {
  const { expanded, fullMessages, loading, error, toggleExpand, deleteMessage, markRead } =
    useMailViewer(thread, folder)

  if (!thread) {
    return (
      <div className="MailViewer empty">
        <div className="placeholder">
          <span className="placeholder-icon" />
          <p>Select a message to read</p>
        </div>
      </div>
    )
  }

  // Toolbar uses the latest message in the thread
  const latestFull = fullMessages.get(thread.latest.uid)
  const latest = latestFull || thread.latest

  const toolbarActions = [
    {
      id: 'reply',
      label: 'Reply',
      icon: 'reply',
      onClick: () => onReply({
        to: latest.from.address,
        subject: `Re: ${thread.subject}`,
        inReplyTo: latest.messageId,
      }),
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: 'forward',
      onClick: () => onReply({
        to: '',
        subject: `Fwd: ${thread.subject}`,
      }),
    },
    {
      id: 'mark-unread',
      label: latest.isRead ? 'Mark unread' : 'Mark read',
      icon: 'mark-unread',
      onClick: () => markRead(latest.uid, !latest.isRead),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      danger: true,
      onClick: async () => {
        await deleteMessage(latest.uid)
        onDelete()
      },
    },
  ]

  return (
    <div className="MailViewer">
      <div className="mobile-nav">
        <button className="mobile-back" onClick={onMobileBack} type="button" aria-label="Back">
          Back
        </button>
      </div>

      <Toolbar actions={toolbarActions} />

      <div className="body">
        {loading ? (
          <div className="loading">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <h1 className="thread-subject">{thread.subject || '(no subject)'}</h1>

            <div className="thread-messages">
              {thread.messages.map(msg => {
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
                      <Avatar name={msg.from.name} email={msg.from.address} size="sm" />
                      <div className="item-meta">
                        <span className="item-sender">
                          {msg.from.name || msg.from.address}
                        </span>
                        {!isExpanded && msg.preview && (
                          <span className="item-preview">{msg.preview}</span>
                        )}
                      </div>
                      <time className="item-date">
                        {isExpanded ? formatFullDate(msg.date) : formatDate(msg.date)}
                      </time>
                    </button>

                    {isExpanded && (
                      <div className="item-body">
                        <div className="item-recipients">
                          <span className="to-label">To:</span>
                          <span className="to-list">
                            {(full?.to || msg.to).map(formatAddress).join(', ')}
                          </span>
                          {full?.cc && full.cc.length > 0 && (
                            <>
                              <span className="to-label">Cc:</span>
                              <span className="to-list">
                                {full.cc.map(formatAddress).join(', ')}
                              </span>
                            </>
                          )}
                        </div>

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
                              {full.attachments.length} attachment{full.attachments.length > 1 ? 's' : ''}
                            </span>
                            <ul className="attachments-list">
                              {full.attachments.map((att: MailAttachment) => (
                                <li key={att.partId} className="attachment-chip">
                                  <a
                                    href={`/api/messages/${msg.uid}/attachments/${att.partId}?folder=${encodeURIComponent(folder)}`}
                                    download={att.filename}
                                    className="attachment-link"
                                  >
                                    <span className="attachment-icon" />
                                    <span className="attachment-name">{att.filename}</span>
                                    <span className="attachment-size">{formatBytes(att.size)}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="item-actions">
                          <button
                            className="reply-btn"
                            type="button"
                            onClick={() => onReply({
                              to: msg.from.address,
                              subject: `Re: ${thread.subject}`,
                              inReplyTo: msg.messageId,
                            })}
                          >
                            Reply
                          </button>
                          <button
                            className="forward-btn"
                            type="button"
                            onClick={() => onReply({
                              to: '',
                              subject: `Fwd: ${thread.subject}`,
                            })}
                          >
                            Forward
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
