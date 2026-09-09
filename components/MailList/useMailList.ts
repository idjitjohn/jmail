'use client'

import { useLocale } from '../LocaleProvider/useLocale'
import { folderLabel as localizedFolderName } from '@/lib/i18n/folders'
import { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react'
import type { MailMessage, MailFolder } from '@/lib/types'
import type { MailFilter } from '@/lib/mail-search'
import { usePreferences } from '../PreferencesProvider/usePreferences'
import { groupIntoThreads } from '@/lib/threads'
import type { MailListOptions } from './types'

export const useMailList = ({
  folder,
  refreshTrigger,
  selectedThread,
  onSelect,
  onRefresh,
}: MailListOptions) => {
  const { locale } = useLocale()
  const { preferences } = usePreferences()
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [resultKey, setResultKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('folder')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [fields, setFields] = useState({
    from: '',
    to: '',
    subject: '',
    after: '',
    before: '',
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [destinations, setDestinations] = useState<MailFolder[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [folderQuery, setFolderQuery] = useState('')
  const [filter, setFilter] = useState<MailFilter>('all')
  const [refreshCount, setRefreshCount] = useState(0)
  const [markingRead, setMarkingRead] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchOptionsRef = useRef<HTMLButtonElement>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const moveButtonRef = useRef<HTMLButtonElement>(null)
  const searchOptionsId = useId()
  const folderPickerId = useId()
  const requestRef = useRef<AbortController | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchMessages = useCallback(
    async (pg = 1) => {
      requestRef.current?.abort()
      const controller = new AbortController()
      requestRef.current = controller
      loadingRef.current = true
      setLoading(true)
      setError(null)
      if (pg === 1) {
        setSelected(new Set())
        setMoveOpen(false)
      }
      try {
        const params = new URLSearchParams({
          folder,
          page: String(pg),
          q: query,
          filter,
          scope,
          ...fields,
        })
        const endpoint = '/api/messages/search'
        const res = await fetch(`${endpoint}?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok)
          throw new Error('Could not load your messages. Please try again.')
        const data = await res.json()
        if (controller.signal.aborted) return
        setMessages((prev) =>
          pg === 1
            ? data.messages
            : [
                ...prev,
                ...data.messages.filter(
                  (m: MailMessage) =>
                    !prev.some((p) => p.uid === m.uid && p.folder === m.folder),
                ),
              ],
        )
        setResultKey(
          `${folder}:${query}:${filter}:${scope}:${JSON.stringify(fields)}`,
        )
        setHasMore(data.hasMore)
        setTotal(data.total)
        setPage(pg)
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Could not load messages')
      } finally {
        if (!controller.signal.aborted) {
          loadingRef.current = false
          setLoading(false)
        }
      }
    },
    [folder, query, filter, scope, fields],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IMAP request synchronization
    void fetchMessages()
    return () => requestRef.current?.abort()
  }, [fetchMessages, refreshTrigger, refreshCount])

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), [])
  const threads = useMemo(
    () =>
      groupIntoThreads(
        resultKey ===
          `${folder}:${query}:${filter}:${scope}:${JSON.stringify(fields)}`
          ? messages
          : [],
      ),
    [messages, resultKey, folder, query, filter, scope, fields],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!preferences.keyboardShortcuts) return
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        document.querySelector('[aria-modal="true"]')
      )
        return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (['j', 'k'].includes(event.key.toLowerCase()) && threads.length) {
        event.preventDefault()
        const index = threads.findIndex(
          (thread) => thread.id === selectedThread?.id,
        )
        const next =
          index < 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  threads.length - 1,
                  index + (event.key.toLowerCase() === 'j' ? 1 : -1),
                ),
              )
        onSelect(threads[next])
      }
    }
    const focusSearch = () => searchRef.current?.focus()
    window.addEventListener('keydown', handleKey)
    window.addEventListener('jmail:search', focusSearch)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('jmail:search', focusSearch)
    }
  }, [threads, selectedThread, onSelect, preferences.keyboardShortcuts])

  useEffect(() => {
    document
      .querySelector('.MailItem.selected')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedThread?.id])

  const markAllRead = async () => {
    if (markingRead) return
    setMarkingRead(true)
    try {
      const res = await fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!res.ok)
        throw new Error('Could not mark messages as read. Please try again.')
      refresh()
      onRefresh?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update messages')
    } finally {
      setMarkingRead(false)
    }
  }

  const handleSwipeDelete = async (
    thread: import('@/lib/types').MailThread,
  ) => {
    try {
      const results = await Promise.all(
        thread.messages.map((message) =>
          fetch(
            `/api/messages/${message.uid}?folder=${encodeURIComponent(message.folder)}`,
            { method: 'DELETE' },
          ),
        ),
      )
      if (results.some((result) => !result.ok))
        throw new Error('Some messages could not be deleted. Please try again.')
      refresh()
      onRefresh?.()
      return true
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not delete these messages.',
      )
      return false
    }
  }

  useEffect(() => {
    fetch('/api/folders')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setDestinations(data)
      })
      .catch(() => {})
  }, [refreshTrigger])
  const selectedThreads = threads.filter((thread) => selected.has(thread.id))
  const allSelected =
    threads.length > 0 && selectedThreads.length === threads.length
  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate =
        selectedThreads.length > 0 && !allSelected
  }, [selectedThreads.length, allSelected, selectionMode])
  const toggleSelectionMode = () => {
    if (bulkBusy) return
    setSelectionMode((previous) => !previous)
    setSelected(new Set())
    setMoveOpen(false)
  }
  const toggleSelection = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const bulkAction = async (action: string, destination?: string) => {
    if (bulkBusy || !selectedThreads.length) return
    setBulkBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          destination,
          messages: selectedThreads.flatMap((thread) =>
            thread.messages.map((message) => ({
              uid: message.uid,
              folder: message.folder,
            })),
          ),
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || 'Could not update these messages.')
      setSelected(new Set())
      setMoveOpen(false)
      refresh()
      onRefresh?.()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not update these messages.',
      )
    } finally {
      setBulkBusy(false)
    }
  }
  const clearSearch = () => {
    setSearchQuery('')
    setQuery('')
    setFields({ from: '', to: '', subject: '', after: '', before: '' })
    searchRef.current?.focus()
  }

  return {
    scope,
    setScope,
    advancedOpen,
    toggleSearchOptions: () => setAdvancedOpen((previous) => !previous),
    searchOptionsRef,
    searchOptionsId,
    hasSearchOptions: scope === 'all' || Object.values(fields).some(Boolean),
    handleSearchOptionsKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setAdvancedOpen(false)
      searchOptionsRef.current?.focus()
    },
    fields,
    setFields,
    selected,
    selectionMode,
    toggleSelectionMode,
    selectAllRef,
    allSelected,
    selectedCount: selectedThreads.length,
    bulkBusy,
    bulkAction,
    moveOpen,
    moveButtonRef,
    folderPickerId,
    folderQuery,
    setFolderQuery,
    toggleMove: () => {
      setMoveOpen((previous) => !previous)
      setFolderQuery('')
    },
    handleFolderPickerKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setMoveOpen(false)
      moveButtonRef.current?.focus()
    },
    destinations: destinations
      .map((item) => ({ ...item, name: localizedFolderName(item, locale) }))
      .filter((item) =>
        `${item.name} ${item.path}`
          .toLowerCase()
          .includes(folderQuery.trim().toLowerCase()),
      ),
    handleThreadClick: (thread: import('@/lib/types').MailThread) => {
      if (selectionMode) {
        if (!bulkBusy) toggleSelection(thread.id)
      } else onSelect(thread)
    },
    toggleSelection,
    selectAll: () =>
      setSelected(
        selectedThreads.length === threads.length
          ? new Set()
          : new Set(threads.map((thread) => thread.id)),
      ),
    threads,
    loading,
    error,
    hasMore,
    total,
    refresh,
    searchQuery,
    setSearchQuery,
    searchRef,
    filter,
    setFilter,
    clearSearch,
    markAllRead,
    markingRead,
    loadMore: () => {
      if (!loadingRef.current && hasMore) void fetchMessages(page + 1)
    },
    handleSwipeDelete: preferences.swipeToDelete
      ? handleSwipeDelete
      : undefined,
    shortcutsEnabled: preferences.keyboardShortcuts,
    folderLabel: localizedFolderName(
      destinations.find((item) => item.path === folder) || {
        path: folder,
        name: folder,
      },
      locale,
    ),
    emptyTitle: query
      ? 'No matches just yet'
      : filter === 'unread'
        ? 'You’re all caught up'
        : filter === 'starred'
          ? 'Keep the good stuff close'
          : 'A little breathing room',
    emptyDescription: query
      ? 'Try another name, subject, or phrase.'
      : filter === 'unread'
        ? 'No unread messages. Enjoy a moment of focus.'
        : filter === 'starred'
          ? 'Star a message to find it here whenever you need it.'
          : 'No messages in this folder. Your next conversation starts here.',
  }
}
