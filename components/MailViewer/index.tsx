'use client'

import Avatar from '../Avatar'
import Spinner from '../Spinner'
import Toolbar from '../Toolbar'
import { useMailViewer } from './useMailViewer'
import { formatFullDate, formatAddress } from '@/lib/format'
import './MailViewer.scss'

interface Props {
  uid: number | null
  folder: string
  onReply: (message: { to: string; subject: string; inReplyTo?: string }) => void
  onDelete: () => void
}

const replyIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.7 8.7 0 0 0-1.921-.306 7 7 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.5.5 0 0 0 .042-.028z" />
  </svg>
)

const replyAllIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.098 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.7 8.7 0 0 0-1.921-.306 7 7 0 0 0-.798.008h-.013l-.005.001h-.001L8.8 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L4.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.5.5 0 0 0 .042-.028zM3.925 3.32a.5.5 0 0 0-.65.762l.05.043A6 6 0 0 1 5.198 6.5H4.5a.5.5 0 0 0 0 1h1.032a7 7 0 0 1-.14 1.025L4.57 9.2a.5.5 0 0 0 .861.504l.826-.796q.064.061.133.117L7.95 10.72a.144.144 0 0 0 .202-.134V9.432a.5.5 0 0 1 .45-.498l.05.498.5.001h-.001l.005-.001h.013a8 8 0 0 1 .798.008c.608.052 1.289.19 1.921.306 1.02.283 2.185.816 3.205 1.799-.605-2.116-1.611-3.252-2.595-3.876-1.287-.817-2.633-.822-3.3-.822a.5.5 0 0 1-.5-.5V5.147a.144.144 0 0 0-.202-.134z" />
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

export default function MailViewer({ uid, folder, onReply, onDelete }: Props) {
  const { message, loading, error, markRead, deleteMessage } = useMailViewer(uid, folder)

  if (!uid) {
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

  const toolbarActions = message ? [
    {
      id: 'reply',
      label: 'Reply',
      icon: replyIcon,
      onClick: () => onReply({
        to: message.from.address,
        subject: `Re: ${message.subject}`,
        inReplyTo: message.messageId,
      }),
    },
    {
      id: 'reply-all',
      label: 'Reply All',
      icon: replyAllIcon,
      onClick: () => onReply({
        to: [message.from, ...(message.to || [])].map(a => a.address).join(', '),
        subject: `Re: ${message.subject}`,
        inReplyTo: message.messageId,
      }),
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: forwardIcon,
      onClick: () => onReply({
        to: '',
        subject: `Fwd: ${message.subject}`,
      }),
    },
    {
      id: 'mark-unread',
      label: message.isRead ? 'Mark unread' : 'Mark read',
      icon: markUnreadIcon,
      onClick: () => markRead(!message.isRead),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: trashIcon,
      danger: true,
      onClick: async () => {
        await deleteMessage()
        onDelete()
      },
    },
  ] : []

  return (
    <div className="MailViewer">
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
        ) : message ? (
          <>
            <div className="mail-header">
              <h1 className="subject">{message.subject || '(no subject)'}</h1>
              <div className="sender-row">
                <Avatar name={message.from.name} email={message.from.address} size="lg" />
                <div className="sender-info">
                  <p className="sender-name">{message.from.name || message.from.address}</p>
                  {message.from.name && (
                    <p className="sender-email">{message.from.address}</p>
                  )}
                </div>
                <time className="date">{formatFullDate(message.date)}</time>
              </div>
              <div className="recipients">
                <span className="to-label">To:</span>
                <span className="to-list">
                  {message.to.map(formatAddress).join(', ')}
                </span>
                {message.cc && message.cc.length > 0 && (
                  <>
                    <span className="to-label">Cc:</span>
                    <span className="to-list">
                      {message.cc.map(formatAddress).join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mail-body">
              {message.html ? (
                <div
                  className="html-content"
                  dangerouslySetInnerHTML={{ __html: message.html }}
                />
              ) : (
                <pre className="text-content">{message.text}</pre>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
