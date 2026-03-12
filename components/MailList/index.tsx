'use client'

import MailItem from '../MailItem'
import Spinner from '../Spinner'
import Button from '../Button'
import { useMailList } from './useMailList'
import type { MailThread } from '@/lib/types'
import './MailList.scss'

interface Props {
  folder: string
  selectedThread: MailThread | null
  onSelect: (thread: MailThread) => void
  onMobileBack?: () => void
}

export default function MailList({ folder, selectedThread, onSelect, onMobileBack }: Props) {
  const { threads, loading, error, hasMore, loadMore, refresh } = useMailList(folder)

  const folderLabel = folder === 'INBOX' ? 'Inbox' : folder

  return (
    <div className="MailList">
      <div className="header">
        <button className="mobile-back" onClick={onMobileBack} type="button" aria-label="Back">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
          </svg>
        </button>
        <h2 className="title">{folderLabel}</h2>
        <button className="refresh-btn" onClick={refresh} type="button" title="Refresh">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
          </svg>
        </button>
      </div>

      <div className="messages">
        {loading && threads.length === 0 ? (
          <div className="empty-state">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={refresh}>Retry</Button>
          </div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <p>No messages</p>
          </div>
        ) : (
          <>
            {threads.map(thread => (
              <MailItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThread?.id === thread.id}
                onClick={onSelect}
              />
            ))}
            {hasMore && (
              <div className="load-more">
                <Button variant="ghost" size="sm" onClick={loadMore} loading={loading}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
