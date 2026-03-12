import clsx from 'clsx'
import Avatar from '../Avatar'
import { formatDate } from '@/lib/format'
import type { MailMessage } from '@/lib/types'
import './MailItem.scss'

interface Props {
  message: MailMessage
  isSelected: boolean
  onClick: (uid: number) => void
}

export default function MailItem({ message, isSelected, onClick }: Props) {
  const sender = message.from.name || message.from.address

  return (
    <button
      className={clsx('MailItem', { selected: isSelected, unread: !message.isRead })}
      onClick={() => onClick(message.uid)}
      type="button"
    >
      <Avatar name={message.from.name} email={message.from.address} size="md" />

      <div className="content">
        <div className="meta">
          <span className="sender">{sender}</span>
          <span className="date">{formatDate(message.date)}</span>
        </div>
        <p className="subject">{message.subject || '(no subject)'}</p>
        {message.preview && <p className="preview">{message.preview}</p>}
      </div>

      {!message.isRead && <span className="unread-dot" aria-hidden="true" />}
    </button>
  )
}
