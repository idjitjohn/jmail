'use client'

import { useRef, useState } from 'react'
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
  onRefresh?: () => void
}

export default function MailList({ folder, selectedThread, onSelect, onMobileBack, onRefresh }: Props) {
  const { threads, loading, error, hasMore, loadMore, refresh, searchQuery, search, searching } = useMailList(folder)

  const handleSwipeDelete = async (thread: import('@/lib/types').MailThread) => {
    try {
      await Promise.all(
        thread.messages.map(m =>
          fetch(`/api/messages/${m.uid}?folder=${encodeURIComponent(folder)}`, { method: 'DELETE' })
        )
      )
      refresh()
      onRefresh?.()
    } catch { /* non-fatal */ }
  }
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const folderLabel = folder === 'INBOX' ? 'Inbox' : folder

  const handleSearchToggle = () => {
    if (searchOpen) {
      search('')
      setSearchOpen(false)
    } else {
      setSearchOpen(true)
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }

  const handleSearchInput = (val: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  return (
    <div className="MailList">
      <div className="header">
        <button className="mobile-back" onClick={onMobileBack} type="button" aria-label="Back" />
        <h2 className="title">{folderLabel}</h2>
        <button
          className={`search-btn${searchOpen ? ' active' : ''}`}
          onClick={handleSearchToggle}
          type="button"
          title="Search"
        />
        <button className="refresh-btn" onClick={refresh} type="button" title="Refresh" />
      </div>

      {searchOpen && (
        <div className="search-bar">
          <span className="search-icon" />
          <input
            ref={searchRef}
            className="search-input"
            type="text"
            placeholder="Search messages..."
            defaultValue={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') handleSearchToggle()
            }}
          />
          {searching && <Spinner size="sm" />}
        </div>
      )}

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
                onSwipeDelete={handleSwipeDelete}
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
