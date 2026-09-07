'use client'

import MailItem from '../MailItem'
import Spinner from '../Spinner'
import Button from '../Button'
import { useMailList } from './useMailList'
import type { MailThread } from '@/lib/types'
import './MailList.scss'

type Props = {
  folder: string
  refreshTrigger: number
  selectedThread: MailThread | null
  onSelect: (thread: MailThread) => void
  onMobileBack?: () => void
  onRefresh?: () => void
}

const MailList = ({
  folder,
  refreshTrigger,
  selectedThread,
  onSelect,
  onMobileBack,
  onRefresh,
}: Props) => {
  const {
    threads,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    searchQuery,
    setSearchQuery,
    searchRef,
    filter,
    setFilter,
    clearSearch,
    markAllRead,
    markingRead,
    handleSwipeDelete,
    folderLabel,
    emptyTitle,
    emptyDescription,
  } = useMailList({
    folder,
    refreshTrigger,
    selectedThread,
    onSelect,
    onRefresh,
  })

  return (
    <section className="MailList" aria-label={`${folderLabel} messages`}>
      <div className="header">
        <button
          className="mobile-back"
          onClick={onMobileBack}
          type="button"
          aria-label="Show folders"
        />
        <h2 className="title">{folderLabel}</h2>
        <button
          className="mark-all-read-btn"
          onClick={markAllRead}
          disabled={markingRead || loading}
          type="button"
          title="Mark folder as read"
          aria-label="Mark folder as read"
        />
        <button
          className={`refresh-btn${loading ? ' refreshing' : ''}`}
          onClick={refresh}
          disabled={loading}
          type="button"
          title="Refresh"
          aria-label="Refresh messages"
        />
      </div>
      <div className="search-bar">
        <input
          ref={searchRef}
          className="search-input"
          type="search"
          placeholder="Search this folder"
          aria-label="Search this folder"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') clearSearch()
          }}
        />
        <kbd>/</kbd>
      </div>
      <div className="filters" role="group" aria-label="Filter messages">
        <button
          type="button"
          className={`filter ${filter === 'all' ? 'active' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All mail
        </button>
        <button
          type="button"
          className={`filter ${filter === 'unread' ? 'active' : ''}`}
          aria-pressed={filter === 'unread'}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button
          type="button"
          className={`filter ${filter === 'starred' ? 'active' : ''}`}
          aria-pressed={filter === 'starred'}
          onClick={() => setFilter('starred')}
        >
          Starred
        </button>
      </div>
      <div className="list-caption" role="status">
        <span>
          {loading
            ? 'Updating your mail…'
            : `${total.toLocaleString()} message${total === 1 ? '' : 's'}`}
        </span>
        <span>Newest first</span>
      </div>
      <div className="messages" aria-busy={loading}>
        {error && (
          <div className="error-state" role="alert">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={refresh}>
              Try again
            </Button>
          </div>
        )}
        {loading && threads.length === 0 ? (
          <div className="empty-state">
            <Spinner size="md" />
            <p>Getting your mail ready…</p>
          </div>
        ) : !error && threads.length === 0 ? (
          <div className="empty-state">
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
          </div>
        ) : (
          <>
            {threads.map((thread) => (
              <MailItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThread?.id === thread.id}
                onClick={onSelect}
                onSwipeDelete={handleSwipeDelete}
              />
            ))}
            {hasMore && (
              <div className="load-more">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  loading={loading}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default MailList
