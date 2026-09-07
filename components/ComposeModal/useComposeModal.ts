'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts'
import { getSignatures } from '@/lib/signatures'
import { templateToHtml } from '@/lib/reply-templates'
import {
  mentionsAttachment,
  toLocalDateTime,
  schedulePresets,
} from '@/lib/compose-utils'
import type { ComposeOptions } from './types'

export const useComposeModal = ({
  isOpen,
  userEmail,
  onClose,
  onSent,
  to: initialTo = '',
  subject: initialSubject = '',
  body: initialBody = '',
  inReplyTo,
}: ComposeOptions) => {
  const [draft] = useState(() =>
    !initialTo && !initialSubject && !initialBody ? loadDraft(userEmail) : null,
  )
  const [to, setTo] = useState(draft?.to ?? initialTo)
  const [cc, setCc] = useState(draft?.cc ?? '')
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
  const [showCc, setShowCc] = useState(Boolean(draft?.cc))
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [draftBanner, setDraftBanner] = useState(Boolean(draft))
  const [draftStatus, setDraftStatus] = useState('Draft saves on this device')
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

  const resetEditor = useCallback((html: string) => {
    setBodyHtml(html)
    setResetToken((t) => t + 1)
  }, [])

  const persistDraft = useCallback(() => {
    if (skipSave.current) return
    if (!to && !cc && !subject && !bodyHtml) {
      clearDraft(userEmail)
      return
    }
    const saved = saveDraft(
      {
        to,
        cc,
        subject,
        bodyHtml,
        signatureId,
        inReplyTo: inReplyToRef.current,
      },
      userEmail,
    )
    setDraftStatus(
      saved
        ? 'Draft saved on this device'
        : 'Draft could not be saved on this device',
    )
  }, [to, cc, subject, bodyHtml, signatureId, userEmail])

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

  const handleClose = useCallback(() => {
    if (sending || scheduling) return
    undoSend()
    if (draftTimer.current) clearTimeout(draftTimer.current)
    persistDraft()
    onClose()
  }, [sending, scheduling, undoSend, persistDraft, onClose])

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
    fd.append('subject', subject)
    fd.append('bodyHtml', bodyHtml)
    fd.append('signatureHtml', signatureHtml ?? '')
    fd.append('inReplyTo', inReplyToRef.current ?? '')
    attachments.forEach((f) => fd.append('attachments', f))
    return fd
  }

  const validate = () => {
    if (!to.trim()) {
      setError('Add a recipient to send your message.')
      return false
    }
    if (!subject.trim()) {
      setError('Add a subject so your message is easy to find.')
      return false
    }
    return true
  }

  const finish = (message: string) => {
    skipSave.current = true
    if (draftTimer.current) clearTimeout(draftTimer.current)
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
      finish('Message sent. Nicely done.')
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
    const deadline = Date.now() + 8000
    setCountdown(8)
    countdownTimer.current = setInterval(
      () =>
        setCountdown(Math.max(1, Math.ceil((deadline - Date.now()) / 1000))),
      250,
    )
    sendTimer.current = setTimeout(() => {
      clearTimers()
      void deliver(formData)
    }, 8000)
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
      finish(
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
    setAttachments((prev) => [...prev, ...Array.from(files)])
    setAttachmentWarning(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return {
    to,
    setTo,
    cc,
    setCc,
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
    discardDraft: () => {
      if (busyRef.current) return
      skipSave.current = true
      if (draftTimer.current) clearTimeout(draftTimer.current)
      clearDraft(userEmail)
      onClose()
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
    busy: countdown !== null || sending || scheduling,
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
