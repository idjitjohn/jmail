'use client'

import Avatar from '../Avatar'
import Spinner from '../Spinner'
import Toolbar from '../Toolbar'
import { useMailViewer } from './useMailViewer'
import { formatFullDate, formatDate, formatAddress } from '@/lib/format'
import type { MailThread } from '@/lib/types'
import './MailViewer.scss'

interface Props {
  thread: MailThread | null
  folder: string
  onReply: (data: { to: string; subject: string; inReplyTo?: string }) => void
  onDelete: () => void
  onMobileBack?: () => void
}

const replyIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.7 8.7 0 0 0-1.921-.306 7 7 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.5.5 0 0 0 .042-.028z" />
  </svg>
)

const forwardIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.502 5.013a.144.144 0 0 0-.202.134V6.3a.5.5 0 0 1-.5.5c-.667 0-2.013.005-3.3.822-.984.624-1.99 1.76-2.595 3.876 1.02-.983 2.185-1.516 3.205-1.799a8.7 8.7 0 0 1 1.921-.306 7 7 0 0 1 .798.008h.013l.005.001h.001L8.8 9.9l.05-.498a.5.5 0 0 1 .45.498v1.153c0 .108.11.176.202.134l3.984-2.933a.503.503 0 0 0 .042-.028.147.147 0 0 0 0-.252.5.5 0 0 0-.042-.028z" />
  </svg>
)

const trashIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
)

const markUnreadIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
  </svg>
)

export default function MailViewer({ thread, folder, onReply, onDelete, onMobileBack }: Props) {
  const { expanded, fullMessages, loading, error, toggleExpand, deleteMessage, markRead } =
    useMailViewer(thread, folder)

  if (!thread) {
    return (
      <div className="MailViewer empty">
        <div className="placeholder">
          <svg className="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
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
      icon: replyIcon,
      onClick: () => onReply({
        to: latest.from.address,
        subject: `Re: ${thread.subject}`,
        inReplyTo: latest.messageId,
      }),
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: forwardIcon,
      onClick: () => onReply({
        to: '',
        subject: `Fwd: ${thread.subject}`,
      }),
    },
    {
      id: 'mark-unread',
      label: latest.isRead ? 'Mark unread' : 'Mark read',
      icon: markUnreadIcon,
      onClick: () => markRead(latest.uid, !latest.isRead),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: trashIcon,
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
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
          </svg>
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
                            {replyIcon}
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
                            {forwardIcon}
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
