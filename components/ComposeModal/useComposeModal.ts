'use client'

import { useState } from 'react'

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
  const [body, setBody] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const init = (data: ComposeInit) => {
    setTo(data.to || '')
    setSubject(data.subject || '')
    setBody(data.body || '')
    setShowCc(false)
    setCc('')
    setError('')
  }

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Recipient is required')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, cc, subject, body }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send message')
        return
      }

      onClose()
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return {
    to, setTo,
    cc, setCc,
    subject, setSubject,
    body, setBody,
    showCc, setShowCc,
    sending, error,
    handleSend,
    init,
  }
}
