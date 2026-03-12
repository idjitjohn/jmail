'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts'
import { getSignatures } from '@/lib/signatures'

interface ComposeInit {
  to?: string
  subject?: string
  body?: string
  inReplyTo?: string
}

export function useComposeModal(onClose: () => void) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [resetToken, setResetToken] = useState(0)
  const [signatureId, setSignatureId] = useState<string | null>(null)
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null)
  const [showCc, setShowCc] = useState(false)
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [draftBanner, setDraftBanner] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const inReplyToRef = useRef<string | undefined>(undefined)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save draft with 1.5s debounce
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      if (!to && !subject && !bodyHtml) return
      saveDraft({ to, cc, subject, bodyHtml, signatureId })
    }, 1500)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [to, cc, subject, bodyHtml, signatureId])

  const resetEditor = useCallback((html: string) => {
    setBodyHtml(html)
    setResetToken(t => t + 1)
  }, [])

  const init = useCallback((data: ComposeInit) => {
    inReplyToRef.current = data.inReplyTo
    setShowCc(false)
    setCc('')
    setError('')
    setAttachments([])
    setShowSchedule(false)
    setScheduleAt('')

    // Restore draft only for blank new compose (not reply/forward)
    if (!data.to && !data.subject && !data.body) {
      const draft = loadDraft()
      if (draft) {
        setTo(draft.to)
        setCc(draft.cc)
        setSubject(draft.subject)
        setSignatureId(draft.signatureId)
        if (draft.signatureId) {
          const sig = getSignatures().find(s => s.id === draft.signatureId)
          setSignatureHtml(sig?.html ?? null)
        } else {
          setSignatureHtml(null)
        }
        resetEditor(draft.bodyHtml)
        setDraftBanner(true)
        return
      }
    }

    setTo(data.to || '')
    setSubject(data.subject || '')
    setSignatureId(null)
    setSignatureHtml(null)
    setDraftBanner(false)
    resetEditor(data.body || '')
  }, [resetEditor])

  const dismissDraftBanner = () => setDraftBanner(false)

  const handleSignatureChange = (id: string | null, html: string | null) => {
    setSignatureId(id)
    setSignatureHtml(html)
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('to', to)
    fd.append('cc', cc)
    fd.append('subject', subject)
    fd.append('bodyHtml', bodyHtml)
    fd.append('signatureHtml', signatureHtml ?? '')
    fd.append('inReplyTo', inReplyToRef.current ?? '')
    attachments.forEach(f => fd.append('attachments', f))
    return fd
  }

  const validate = () => {
    if (!to.trim()) { setError('Recipient is required'); return false }
    if (!subject.trim()) { setError('Subject is required'); return false }
    return true
  }

  const handleSend = async () => {
    if (!validate()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages/send', { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send'); return }
      clearDraft()
      onClose()
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSchedule = async () => {
    if (!validate()) return
    if (!scheduleAt) { setError('Pick a date and time'); return }
    if (new Date(scheduleAt) <= new Date()) { setError('Schedule time must be in the future'); return }
    setScheduling(true)
    setError('')
    try {
      const fd = buildFormData()
      fd.append('scheduleAt', new Date(scheduleAt).toISOString())
      const res = await fetch('/api/messages/schedule', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to schedule'); return }
      clearDraft()
      onClose()
    } catch {
      setError('Failed to schedule. Please try again.')
    } finally {
      setScheduling(false)
    }
  }

  const addAttachments = (files: FileList | null) => {
    if (!files) return
    setAttachments(prev => [...prev, ...Array.from(files)])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return {
    to, setTo,
    cc, setCc,
    subject, setSubject,
    bodyHtml, setBodyHtml,
    resetToken,
    signatureId, signatureHtml,
    handleSignatureChange,
    showCc, setShowCc,
    sending, scheduling, error,
    attachments, addAttachments, removeAttachment,
    draftBanner, dismissDraftBanner,
    showSchedule, setShowSchedule,
    scheduleAt, setScheduleAt,
    handleSend, handleSchedule,
    init,
  }
}
