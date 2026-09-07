'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MailMessage, MailThread } from '@/lib/types'
import type { ComposeState } from '../AppLayout/types'

export const useMailViewer = (
  thread: MailThread | null,
  folder: string,
  onReply: (data: ComposeState) => void,
  onDelete: () => void,
  onUpdate?: () => void,
) => {
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const actionBusy = useRef(false)
  const generation = useRef(0)

  // UIDs currently expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  // Full message content keyed by UID
  const [fullMessages, setFullMessages] = useState<Map<number, MailMessage>>(
    new Map(),
  )
  // Loading state for initial expand
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track fetched UIDs to avoid duplicate requests
  const fetchedRef = useRef<Set<number>>(new Set())

  const fetchFull = useCallback(
    async (uid: number) => {
      if (fetchedRef.current.has(uid)) return
      fetchedRef.current.add(uid)
      const current = generation.current
      try {
        const res = await fetch(
          `/api/messages/${uid}?folder=${encodeURIComponent(folder)}`,
        )
        if (!res.ok) throw new Error('Failed to load message')
        const data = await res.json()
        if (current === generation.current)
          setFullMessages((prev) => new Map([...prev, [uid, data]]))
      } catch (e) {
        if (current !== generation.current) return
        fetchedRef.current.delete(uid)
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    },
    [folder],
  )

  // Reset when thread changes, auto-expand and load latest
  useEffect(() => {
    generation.current += 1
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IMAP message synchronization
    setActionError('')
    if (!thread) {
      setExpanded(new Set())
      setFullMessages(new Map())
      fetchedRef.current = new Set()
      setError(null)
      return
    }

    const latestUid = thread.latest.uid
    setExpanded(new Set([latestUid]))
    setFullMessages(new Map())
    fetchedRef.current = new Set()
    setError(null)

    setLoading(true)
    const current = generation.current
    fetchFull(latestUid).finally(() => {
      if (current === generation.current) setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, folder])

  const toggleExpand = useCallback(
    (uid: number) => {
      setExpanded((prev) => {
        const s = new Set(prev)
        if (s.has(uid)) {
          s.delete(uid)
        } else {
          s.add(uid)
          fetchFull(uid)
        }
        return s
      })
    },
    [fetchFull],
  )

  const latest = thread
    ? fullMessages.get(thread.latest.uid) || thread.latest
    : null

  const runAction = async (action: () => Promise<void>) => {
    if (actionBusy.current) return
    const current = generation.current
    actionBusy.current = true
    setBusy(true)
    setActionError('')
    try {
      await action()
    } catch (e) {
      if (current === generation.current)
        setActionError(
          e instanceof Error ? e.message : 'Could not update this message.',
        )
    } finally {
      actionBusy.current = false
      setBusy(false)
    }
  }

  const updateMessage = (patch: { isFlagged?: boolean; isRead?: boolean }) =>
    runAction(async () => {
      if (!latest) return
      const current = generation.current
      const res = await fetch(`/api/messages/${latest.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, folder }),
      })
      if (!res.ok)
        throw new Error('Could not update this message. Please try again.')
      if (current === generation.current)
        setFullMessages(
          (prev) =>
            new Map([
              ...prev,
              [latest.uid, { ...(prev.get(latest.uid) ?? latest), ...patch }],
            ]),
        )
      onUpdate?.()
    })

  const archive = () =>
    runAction(async () => {
      if (!thread) return
      const current = generation.current
      const res = await fetch('/api/messages/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder,
          uids: thread.messages.map((message) => message.uid),
        }),
      })
      if (!res.ok)
        throw new Error(
          'Could not archive this conversation. Please try again.',
        )
      if (current === generation.current) onDelete()
      else onUpdate?.()
    })

  const toolbarActions =
    latest && thread
      ? [
          {
            id: 'reply',
            label: 'Reply',
            icon: 'reply',
            onClick: () =>
              onReply({
                to: latest.from.address,
                subject: `Re: ${thread.subject}`,
                inReplyTo: latest.messageId,
              }),
          },
          {
            id: 'forward',
            label: 'Forward',
            icon: 'forward',
            onClick: () =>
              onReply({ to: '', subject: `Fwd: ${thread.subject}` }),
          },
          {
            id: 'archive',
            label: 'Archive',
            icon: 'archive',
            onClick: archive,
            disabled: busy,
          },
          {
            id: 'star',
            label: latest.isFlagged ? 'Unstar' : 'Star',
            icon: latest.isFlagged ? 'star-filled' : 'star',
            active: latest.isFlagged,
            onClick: () => updateMessage({ isFlagged: !latest.isFlagged }),
            disabled: busy,
          },
          {
            id: 'mark-unread',
            label: latest.isRead ? 'Mark unread' : 'Mark read',
            icon: 'mark-unread',
            onClick: () => updateMessage({ isRead: !latest.isRead }),
            disabled: busy,
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'trash',
            danger: true,
            disabled: busy,
            onClick: () =>
              runAction(async () => {
                const current = generation.current
                const res = await fetch(
                  `/api/messages/${latest.uid}?folder=${encodeURIComponent(folder)}`,
                  { method: 'DELETE' },
                )
                if (!res.ok)
                  throw new Error(
                    'Could not delete this message. Please try again.',
                  )
                if (current === generation.current) onDelete()
                else onUpdate?.()
              }),
          },
        ]
      : []

  return {
    expanded,
    fullMessages,
    loading,
    error,
    toggleExpand,
    toolbarActions,
    actionError,
  }
}
