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
        <button className="mobile-back" onClick={onMobileBack} type="button" aria-label="Back" />
        <h2 className="title">{folderLabel}</h2>
        <button className="refresh-btn" onClick={refresh} type="button" title="Refresh" />
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
            <span className="empty-icon" />
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
