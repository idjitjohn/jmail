'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

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
  const { t, plural } = useLocale()

  const {
    scope,
    setScope,
    advancedOpen,
    toggleSearchOptions,
    searchOptionsRef,
    searchOptionsId,
    hasSearchOptions,
    handleSearchOptionsKeyDown,
    fields,
    setFields,
    selected,
    selectionMode,
    toggleSelectionMode,
    selectAllRef,
    allSelected,
    selectedCount,
    bulkBusy,
    bulkAction,
    destinations,
    moveOpen,
    moveButtonRef,
    folderPickerId,
    folderQuery,
    setFolderQuery,
    toggleMove,
    handleFolderPickerKeyDown,
    handleThreadClick,
    toggleSelection,
    selectAll,
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
    shortcutsEnabled,
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
    <section
      className="MailList"
      aria-label={t('{0} messages', { '0': folderLabel })}
    >
      <div className="header">
        <button
          className="mobile-back"
          onClick={onMobileBack}
          type="button"
          aria-label={t('Show folders')}
        />
        <h2 className="title">{folderLabel}</h2>
        <button
          className="mark-all-read-btn"
          onClick={markAllRead}
          disabled={markingRead || loading}
          type="button"
          title={t('Mark folder as read')}
          aria-label={t('Mark folder as read')}
        />
        <button
          className={`refresh-btn${loading ? ' refreshing' : ''}`}
          onClick={refresh}
          disabled={loading}
          type="button"
          title={t('Refresh')}
          aria-label={t('Refresh messages')}
        />
      </div>
      <div className="search-bar">
        <input
          ref={searchRef}
          className="search-input"
          type="search"
          placeholder={
            scope === 'all' ? t('Search all folders') : t('Search this folder')
          }
          aria-label={
            scope === 'all' ? t('Search all folders') : t('Search this folder')
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') clearSearch()
          }}
        />
        {shortcutsEnabled && <kbd>/</kbd>}
        <button
          ref={searchOptionsRef}
          className={`search-options-toggle${advancedOpen || hasSearchOptions ? ' active' : ''}`}
          type="button"
          aria-label={t('Search options')}
          title={t('Search options')}
          aria-expanded={advancedOpen}
          aria-controls={searchOptionsId}
          onClick={toggleSearchOptions}
        />
      </div>
      {advancedOpen && (
        <div
          className="advanced-search"
          id={searchOptionsId}
          role="region"
          aria-label={t('Search options')}
          onKeyDown={handleSearchOptionsKeyDown}
        >
          <fieldset className="search-scope">
            <legend>{t('Search in')}</legend>
            <div className="scope-choices">
              <label className="scope-choice">
                <input
                  type="radio"
                  name={searchOptionsId}
                  value="folder"
                  checked={scope === 'folder'}
                  onChange={() => setScope('folder')}
                />
                <span>{t('This folder')}</span>
              </label>
              <label className="scope-choice">
                <input
                  type="radio"
                  name={searchOptionsId}
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                />
                <span>{t('All folders')}</span>
              </label>
            </div>
          </fieldset>
          {(['from', 'to', 'subject', 'after', 'before'] as const).map(
            (field) => (
              <label className={`search-field ${field}`} key={field}>
                {field === 'after'
                  ? t('On or after')
                  : field === 'before'
                    ? t('Before')
                    : field === 'from'
                      ? t('From')
                      : field === 'to'
                        ? t('To')
                        : t('Subject')}
                <input
                  type={
                    field === 'after' || field === 'before' ? 'date' : 'text'
                  }
                  value={fields[field]}
                  onChange={(event) =>
                    setFields((previous) => ({
                      ...previous,
                      [field]: event.target.value,
                    }))
                  }
                />
              </label>
            ),
          )}
          <button className="clear-search" type="button" onClick={clearSearch}>
            {t('Clear search')}
          </button>
        </div>
      )}
      <div className="filters" role="group" aria-label={t('Filter messages')}>
        <button
          type="button"
          className={`filter ${filter === 'all' ? 'active' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {t('All mail')}
        </button>
        <button
          type="button"
          className={`filter ${filter === 'unread' ? 'active' : ''}`}
          aria-pressed={filter === 'unread'}
          onClick={() => setFilter('unread')}
        >
          {t('Unread')}
        </button>
        <button
          type="button"
          className={`filter ${filter === 'starred' ? 'active' : ''}`}
          aria-pressed={filter === 'starred'}
          onClick={() => setFilter('starred')}
        >
          {t('Starred')}
        </button>
        <button
          className={`selection-toggle${selectionMode ? ' active' : ''}`}
          type="button"
          aria-label={
            selectionMode ? t('Cancel selection') : t('Select messages')
          }
          title={selectionMode ? t('Cancel selection') : t('Select messages')}
          aria-pressed={selectionMode}
          disabled={bulkBusy}
          onClick={toggleSelectionMode}
        />
      </div>
      {selectionMode && (
        <div
          className="bulk-actions"
          role="group"
          aria-label={t('Selected messages')}
        >
          <div className="selection-summary">
            <label className="select-visible">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={selectAll}
                disabled={loading || bulkBusy || !threads.length}
                aria-label={t('Select all visible messages')}
              />
              <span>{t('All visible')}</span>
            </label>
            <span className="selected-count" role="status">
              {selectedCount
                ? plural(
                    '{count} selected message',
                    '{count} selected messages',
                    selectedCount,
                  )
                : t('Choose messages below')}
            </span>
          </div>
          <div className="action-buttons">
            <button
              className="bulk-action archive"
              type="button"
              title={t('Archive')}
              aria-label={t('Archive')}
              disabled={!selectedCount || bulkBusy}
              onClick={() => bulkAction('archive')}
            />
            <button
              className="bulk-action trash"
              type="button"
              title={t('Move to Trash')}
              aria-label={t('Move to Trash')}
              disabled={!selectedCount || bulkBusy}
              onClick={() => bulkAction('trash')}
            />
            <button
              className="bulk-action read"
              type="button"
              title={t('Mark read')}
              aria-label={t('Mark read')}
              disabled={!selectedCount || bulkBusy}
              onClick={() => bulkAction('read')}
            />
            <button
              className="bulk-action unread"
              type="button"
              title={t('Mark unread')}
              aria-label={t('Mark unread')}
              disabled={!selectedCount || bulkBusy}
              onClick={() => bulkAction('unread')}
            />
            <button
              className="bulk-action star"
              type="button"
              title={t('Star')}
              aria-label={t('Star')}
              disabled={!selectedCount || bulkBusy}
              onClick={() => bulkAction('star')}
            />
            <button
              ref={moveButtonRef}
              className={`bulk-action move${moveOpen && selectedCount ? ' active' : ''}`}
              type="button"
              title={t('Move to folder')}
              aria-label={t('Move to folder')}
              aria-expanded={moveOpen && selectedCount > 0}
              aria-controls={folderPickerId}
              disabled={!selectedCount || bulkBusy}
              onClick={toggleMove}
            />
          </div>
          {moveOpen && selectedCount > 0 && (
            <div
              className="folder-picker"
              id={folderPickerId}
              role="group"
              aria-label={t('Move selected messages to folder')}
              onKeyDown={handleFolderPickerKeyDown}
            >
              <input
                className="folder-search"
                type="search"
                aria-label={t('Find a destination folder')}
                placeholder={t('Find a folder…')}
                value={folderQuery}
                onChange={(event) => setFolderQuery(event.target.value)}
                autoFocus
              />
              <div className="folder-choices">
                {destinations.map((destination) => (
                  <button
                    className="folder-choice"
                    key={destination.path}
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => bulkAction('move', destination.path)}
                    title={destination.path}
                  >
                    <span>{destination.name}</span>
                  </button>
                ))}
                {!destinations.length && (
                  <p className="no-folders">{t('No matching folders.')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="list-caption" role="status">
        <span>
          {loading
            ? t('Updating your mail…')
            : plural('{count} message', '{count} messages', total)}
        </span>
        <span>{t('Newest first')}</span>
      </div>
      <div className="messages" aria-busy={loading}>
        {error && (
          <div className="error-state" role="alert">
            <p>{t(error)}</p>
            <Button variant="secondary" size="sm" onClick={refresh}>
              {t('Try again')}
            </Button>
          </div>
        )}
        {loading && threads.length === 0 ? (
          <div className="empty-state">
            <Spinner size="md" />
            <p>{t('Getting your mail ready…')}</p>
          </div>
        ) : !error && threads.length === 0 ? (
          <div className="empty-state">
            <h3>{t(emptyTitle)}</h3>
            <p>{t(emptyDescription)}</p>
          </div>
        ) : (
          <>
            {threads.map((thread) => (
              <div className="message-row" key={thread.id}>
                {selectionMode && (
                  <input
                    className="selection"
                    type="checkbox"
                    aria-label={t('Select {0}', {
                      '0': thread.subject || 'message',
                    })}
                    checked={selected.has(thread.id)}
                    disabled={bulkBusy}
                    onChange={() => toggleSelection(thread.id)}
                  />
                )}
                <MailItem
                  thread={thread}
                  isSelected={
                    selectionMode
                      ? selected.has(thread.id)
                      : selectedThread?.id === thread.id
                  }
                  onClick={handleThreadClick}
                  onSwipeDelete={selectionMode ? undefined : handleSwipeDelete}
                />
              </div>
            ))}
            {hasMore && (
              <div className="load-more">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  loading={loading}
                >
                  {t('Load more')}
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
