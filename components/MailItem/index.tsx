import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import Avatar from '../Avatar'
import { formatDate } from '@/lib/format'
import type { MailThread } from '@/lib/types'
import './MailItem.scss'

interface Props {
  thread: MailThread
  isSelected: boolean
  onClick: (thread: MailThread) => void
  onSwipeDelete?: (thread: MailThread) => void
}

const REVEAL_MAX = 72  // px — max left reveal width
const COMMIT_PX  = 60  // px — swipe distance to commit
const COMMIT_VEL = 0.5 // px/ms — velocity to commit even if short

export default function MailItem({ thread, isSelected, onClick, onSwipeDelete }: Props) {
  const { subject, participants, latest, messages, unreadCount } = thread

  const senderLabel = participants.length === 1
    ? (participants[0].name || participants[0].address.split('@')[0])
    : participants.slice(0, 2).map(p => p.name || p.address.split('@')[0]).join(', ')

  const btnRef = useRef<HTMLButtonElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)
  const currentX = useRef(0)
  const dirLocked = useRef<'h' | 'v' | null>(null)
  const didSwipe = useRef(false)
  const [swipeX, setSwipeX] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const el = btnRef.current
    if (!el || !onSwipeDelete) return

    const onStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      startTime.current = Date.now()
      currentX.current = 0
      dirLocked.current = null
      didSwipe.current = false
    }

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (!dirLocked.current) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        dirLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
      if (dirLocked.current !== 'h') return

      e.preventDefault()
      currentX.current = dx
      const clamped = Math.max(-REVEAL_MAX, Math.min(0, dx))
      if (clamped !== 0) didSwipe.current = true
      setSwipeX(clamped)
    }

    const onEnd = () => {
      const dx = currentX.current
      const elapsed = Math.max(Date.now() - startTime.current, 1)
      const velocity = Math.abs(dx) / elapsed

      if (dx < -COMMIT_PX || (dx < -10 && velocity > COMMIT_VEL)) {
        setDismissed(true)
        setTimeout(() => onSwipeDelete(thread), 280)
      } else {
        setSwipeX(0)
        setTimeout(() => { didSwipe.current = false }, 50)
      }
      currentX.current = 0
    }

    const onCancel = () => { setSwipeX(0); didSwipe.current = false }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onCancel, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [onSwipeDelete, thread])

  return (
    <button
      ref={btnRef}
      className={clsx('MailItem', { selected: isSelected, unread: unreadCount > 0, dismissed })}
      onClick={() => { if (!didSwipe.current) onClick(thread) }}
      type="button"
      style={swipeX !== 0 ? { '--swipe-x': `${swipeX}px` } as React.CSSProperties : undefined}
    >
      {/* Red delete backdrop, revealed by left swipe */}
      <div className="delete-bg" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
        </svg>
      </div>

      <div className="item-content">
        <Avatar name={participants[0].name} email={participants[0].address} size="md" />

        <div className="content">
          <div className="meta">
            <span className="sender">
              {senderLabel}
              {messages.length > 1 && <span className="count">{messages.length}</span>}
            </span>
            {latest.isFlagged && <span className="star-icon" aria-hidden="true" />}
            <span className="date">{formatDate(latest.date)}</span>
          </div>
          <p className="subject">{subject || '(no subject)'}</p>
          {latest.preview && <p className="preview">{latest.preview}</p>}
        </div>

        {unreadCount > 0 && <span className="unread-dot" aria-hidden="true" />}
      </div>
    </button>
  )
}
