'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts'
import { getSignatures } from '@/lib/signatures'
import { usePreferences } from '../PreferencesProvider/usePreferences'
import { templateToHtml } from '@/lib/reply-templates'
import {
  mentionsAttachment,
  toLocalDateTime,
  schedulePresets,
} from '@/lib/compose-utils'
import type { ComposeOptions } from './types'

const EMPTY_REFERENCES: string[] = []

export const useComposeModal = ({
  isOpen,
  userEmail,
  onClose,
  onSent,
  to: initialTo = '',
  subject: initialSubject = '',
  body: initialBody = '',
  inReplyTo,
  cc: initialCc = '',
  bcc: initialBcc = '',
  attachments: initialAttachments = [],
  draftUid,
  references = EMPTY_REFERENCES,
}: ComposeOptions) => {
  const { preferences } = usePreferences()
  const [draft] = useState(() =>
    !draftUid && !initialTo && !initialSubject && !initialBody
      ? (() => {
          const saved = loadDraft(userEmail)
          return saved?.draftUid ? null : saved
        })()
      : null,
  )
  const [to, setTo] = useState(draft?.to ?? initialTo)
  const [cc, setCc] = useState(draft?.cc ?? initialCc)
  const [bcc, setBcc] = useState(draft?.bcc ?? initialBcc)
  const [showBcc, setShowBcc] = useState(Boolean(draft?.bcc || initialBcc))
  const [subject, setSubject] = useState(draft?.subject ?? initialSubject)
  const [bodyHtml, setBodyHtml] = useState(draft?.bodyHtml ?? initialBody)
  const [resetToken, setResetToken] = useState(0)
  const [signatureId, setSignatureId] = useState<string | null>(
    draft?.signatureId ?? null,
  )
  const [signatureHtml, setSignatureHtml] = useState<string | null>(() =>
    draft?.signatureId
      ? (getSignatures().find((signature) => signature.id === draft.signatureId)
          ?.html ?? null)
      : null,
  )
  const [showCc, setShowCc] = useState(Boolean(draft?.cc || initialCc))
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<File[]>(initialAttachments)
  const [draftBanner, setDraftBanner] = useState(Boolean(draft))
  const [draftStatus, setDraftStatus] = useState('Draft saves to your mailbox')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [sigManagerOpen, setSigManagerOpen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [attachmentWarning, setAttachmentWarning] = useState<
    'send' | 'schedule' | null
  >(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inReplyToRef = useRef<string | undefined>(draft?.inReplyTo ?? inReplyTo)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const busyRef = useRef(false)
  const skipSave = useRef(false)
  const serverDraft = useRef<number | undefined>(draftUid ?? draft?.draftUid)
  const saveQueue = useRef<Promise<boolean>>(Promise.resolve(true))
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const resetEditor = useCallback((html: string) => {
    setBodyHtml(html)
    setResetToken((t) => t + 1)
  }, [])

  const persistDraft = useCallback((): Promise<boolean> => {
    if (
      skipSave.current ||
      (!to && !cc && !bcc && !subject && !bodyHtml && !attachments.length)
    )
      return Promise.resolve(true)
    const local = {
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      signatureId,
      inReplyTo: inReplyToRef.current,
      draftUid: serverDraft.current,
    }
    saveDraft(local, userEmail)
    const fd = new FormData()
    for (const [key, value] of Object.entries({
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      inReplyTo: inReplyToRef.current || '',
      references: references.join(' '),
    }))
      fd.set(key, value)
    attachments.forEach((file) => fd.append('attachments', file))
    const next = saveQueue.current
      .catch(() => false)
      .then(async () => {
        if (skipSave.current) return true
        try {
          if (serverDraft.current) fd.set('uid', String(serverDraft.current))
          setDraftStatus('Saving draft…')
          const response = await fetch('/api/messages/drafts', {
            method: 'PUT',
            body: fd,
          })
          const data = await response.json()
          if (!response.ok)
            throw new Error(data.error || 'Could not save this draft.')
          serverDraft.current = data.uid
          saveDraft({ ...local, draftUid: data.uid }, userEmail)
          setDraftStatus('Saved to Drafts · available on your other devices')
          return true
        } catch {
          setDraftStatus(
            'Mailbox save failed. Keep this window open and try Save & close again.',
          )
          return false
        }
      })
    saveQueue.current = next
    return next
  }, [
    to,
    cc,
    bcc,
    subject,
    bodyHtml,
    signatureId,
    userEmail,
    attachments,
    references,
  ])

  const removeServerDraft = async () => {
    await saveQueue.current
    if (!serverDraft.current) return
    const fd = new FormData()
    fd.set('uid', String(serverDraft.current))
    const response = await fetch('/api/messages/drafts', {
      method: 'DELETE',
      body: fd,
    })
    if (!response.ok)
      throw new Error(
        'The message was saved, but its old draft could not be removed. Check Drafts.',
      )
    serverDraft.current = undefined
  }

  useEffect(() => {
    if (!isOpen || skipSave.current) return
    draftTimer.current = setTimeout(persistDraft, 800)
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
    }
  }, [isOpen, persistDraft])

  const clearTimers = useCallback(() => {
    if (sendTimer.current) clearTimeout(sendTimer.current)
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    sendTimer.current = null
    countdownTimer.current = null
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const focusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      const editor = panelRef.current?.querySelector<HTMLElement>(
        '.RichEditor .editor',
      )
      if (!editor) return
      editor.focus()
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    })
  }, [])

  const undoSend = useCallback(() => {
    clearTimers()
    busyRef.current = false
    setCountdown(null)
    focusEditor()
  }, [clearTimers, focusEditor])

  const handleClose = useCallback(async () => {
    if (sending || scheduling || saving) return
    undoSend()
    if (draftTimer.current) clearTimeout(draftTimer.current)
    setSaving(true)
    const saved = await persistDraft()
    setSaving(false)
    if (saved) {
      clearDraft(userEmail)
      onClose()
    }
  }, [sending, scheduling, saving, undoSend, persistDraft, onClose, userEmail])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (sigManagerOpen) return
      if (event.key === 'Escape') {
        event.preventDefault()
        if (templatesOpen) {
          setTemplatesOpen(false)
          focusEditor()
        } else if (attachmentWarning) {
          setAttachmentWarning(null)
          focusEditor()
        } else if (showSchedule) {
          setShowSchedule(false)
          focusEditor()
        } else if (countdown !== null) undoSend()
        else handleClose()
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [contenteditable="true"], [tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length && !el.closest('[inert]'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panelRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [
    isOpen,
    handleClose,
    sigManagerOpen,
    templatesOpen,
    attachmentWarning,
    showSchedule,
    countdown,
    undoSend,
    focusEditor,
  ])

  useEffect(() => {
    if (!isOpen) return
    const handleUnload = (event: BeforeUnloadEvent) => {
      persistDraft()
      if (busyRef.current || attachments.length) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [isOpen, persistDraft, attachments.length])

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('to', to)
    fd.append('cc', cc)
    fd.append('bcc', bcc)
    fd.append('references', references.join(' '))
    fd.append('subject', subject)
    fd.append('bodyHtml', bodyHtml)
    fd.append('signatureHtml', signatureHtml ?? '')
    fd.append('inReplyTo', inReplyToRef.current ?? '')
    attachments.forEach((f) => fd.append('attachments', f))
    return fd
  }

  const validate = () => {
    if (!to.trim() && !cc.trim() && !bcc.trim()) {
      setError('Add a recipient to send your message.')
      return false
    }
    if (!subject.trim()) {
      setError('Add a subject so your message is easy to find.')
      return false
    }
    return true
  }

  const finish = async (message: string) => {
    skipSave.current = true
    if (draftTimer.current) clearTimeout(draftTimer.current)
    try {
      await removeServerDraft()
    } catch {
      message += ' The old draft could not be removed; check Drafts.'
    }
    clearDraft(userEmail)
    onSent?.(message)
    onClose()
  }

  const deliver = async (formData: FormData) => {
    setCountdown(null)
    setSending(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send your message.')
      await finish(
        data.rejected?.length
          ? `Sent with some recipients rejected: ${data.rejected.join(', ')}`
          : data.savedToSent === false
            ? 'Message sent. A copy could not be saved to Sent.'
            : 'Message sent.',
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not send. Your draft is still here.',
      )
    } finally {
      setSending(false)
      busyRef.current = false
    }
  }

  const handleSend = (skipAttachmentCheck = false) => {
    if (busyRef.current || !validate()) return
    if (
      preferences.attachmentReminder &&
      !skipAttachmentCheck &&
      !attachments.length &&
      mentionsAttachment(bodyHtml)
    ) {
      setAttachmentWarning('send')
      return
    }
    setAttachmentWarning(null)
    setError('')
    setShowSchedule(false)
    busyRef.current = true
    const formData = buildFormData()
    const delay = preferences.undoSendSeconds * 1000
    if (!delay) {
      void deliver(formData)
      return
    }
    const deadline = Date.now() + delay
    setCountdown(preferences.undoSendSeconds)
    countdownTimer.current = setInterval(
      () =>
        setCountdown(Math.max(1, Math.ceil((deadline - Date.now()) / 1000))),
      250,
    )
    sendTimer.current = setTimeout(() => {
      clearTimers()
      void deliver(formData)
    }, delay)
  }

  const handleSchedule = async (skipAttachmentCheck = false) => {
    if (busyRef.current || !validate()) return
    if (
      !scheduleAt ||
      !Number.isFinite(new Date(scheduleAt).getTime()) ||
      new Date(scheduleAt) <= new Date()
    ) {
      setError('Choose a date and time in the future.')
      return
    }
    if (
      preferences.attachmentReminder &&
      !skipAttachmentCheck &&
      !attachments.length &&
      mentionsAttachment(bodyHtml)
    ) {
      setAttachmentWarning('schedule')
      return
    }
    setAttachmentWarning(null)
    busyRef.current = true
    setScheduling(true)
    setError('')
    try {
      const fd = buildFormData()
      fd.append('scheduleAt', new Date(scheduleAt).toISOString())
      const res = await fetch('/api/messages/schedule', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || 'Could not schedule your message.')
      await finish(
        `Message scheduled for ${new Date(scheduleAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not schedule. Your draft is still here.',
      )
    } finally {
      setScheduling(false)
      busyRef.current = false
    }
  }

  const insertTemplate = (text: string) => {
    resetEditor(
      `${bodyHtml}${bodyHtml ? '<p><br></p>' : ''}${templateToHtml(text)}`,
    )
    setTemplatesOpen(false)
    focusEditor()
  }

  const addAttachments = (files: FileList | null) => {
    if (!files) return
    if (
      attachments.reduce((sum, file) => sum + file.size, 0) +
        Array.from(files).reduce((sum, file) => sum + file.size, 0) >
      25 * 1024 * 1024
    ) {
      setError('Attachments must total less than 25 MB.')
      return
    }
    setAttachments((prev) => [...prev, ...Array.from(files)])
    setAttachmentWarning(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return {
    to,
    setTo,
    cc,
    setCc,
    bcc,
    setBcc,
    showBcc,
    setShowBcc,
    saving,
    confirmDiscard,
    setConfirmDiscard,
    subject,
    setSubject,
    bodyHtml,
    setBodyHtml,
    resetToken,
    signatureId,
    signatureHtml,
    handleSignatureChange: (id: string | null, html: string | null) => {
      setSignatureId(id)
      setSignatureHtml(html)
    },
    showCc,
    setShowCc,
    sending,
    scheduling,
    error,
    attachments,
    addAttachments,
    removeAttachment: (index: number) =>
      setAttachments((prev) => prev.filter((_, i) => i !== index)),
    draftBanner,
    dismissDraftBanner: () => setDraftBanner(false),
    draftStatus,
    showSchedule,
    setShowSchedule,
    scheduleAt,
    setScheduleAt,
    handleSend: () => handleSend(),
    handleSchedule: () => handleSchedule(),
    handleClose,
    discardDraft: async () => {
      if (busyRef.current || saving) return
      skipSave.current = true
      if (draftTimer.current) clearTimeout(draftTimer.current)
      setSaving(true)
      try {
        await removeServerDraft()
        clearDraft(userEmail)
        onClose()
      } catch (error) {
        skipSave.current = false
        setError(
          error instanceof Error ? error.message : 'Could not discard draft.',
        )
      } finally {
        setSaving(false)
      }
    },
    templatesOpen,
    setTemplatesOpen,
    insertTemplate,
    sigManagerOpen,
    setSigManagerOpen,
    fileInputRef,
    panelRef,
    countdown,
    undoSend,
    busy: countdown !== null || sending || scheduling || saving,
    attachmentWarning,
    sendWithoutAttachment: () =>
      attachmentWarning === 'schedule'
        ? handleSchedule(true)
        : handleSend(true),
    dismissAttachmentWarning: () => setAttachmentWarning(null),
    minSchedule: toLocalDateTime(new Date()),
    presets: schedulePresets(),
  }
}
