import clsx from 'clsx'
import Avatar from '../Avatar'
import { formatDate } from '@/lib/format'
import type { MailThread } from '@/lib/types'
import './MailItem.scss'

interface Props {
  thread: MailThread
  isSelected: boolean
  onClick: (thread: MailThread) => void
}

export default function MailItem({ thread, isSelected, onClick }: Props) {
  const { subject, participants, latest, messages, unreadCount } = thread

  const senderLabel = participants.length === 1
    ? (participants[0].name || participants[0].address.split('@')[0])
    : participants.slice(0, 2).map(p => p.name || p.address.split('@')[0]).join(', ')

  return (
    <button
      className={clsx('MailItem', { selected: isSelected, unread: unreadCount > 0 })}
      onClick={() => onClick(thread)}
      type="button"
    >
      <Avatar name={participants[0].name} email={participants[0].address} size="md" />

      <div className="content">
        <div className="meta">
          <span className="sender">
            {senderLabel}
            {messages.length > 1 && <span className="count">{messages.length}</span>}
          </span>
          <span className="date">{formatDate(latest.date)}</span>
        </div>
        <p className="subject">{subject || '(no subject)'}</p>
        {latest.preview && <p className="preview">{latest.preview}</p>}
      </div>

      {unreadCount > 0 && <span className="unread-dot" aria-hidden="true" />}
    </button>
  )
}
