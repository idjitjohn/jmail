'use client'

import { useState, useEffect } from 'react'

export function useVacationSettings() {
  const [enabled, setEnabled] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings/vacation')
      .then(r => r.json())
      .then(data => {
        if (data.subject || data.message) {
          setEnabled(true)
          setSubject(data.subject ?? '')
          setMessage(data.message ?? '')
          setDays(data.days ?? 7)
        }
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError('')
    setSaved(false)

    if (!enabled) {
      setSaving(true)
      try {
        await fetch('/api/settings/vacation', { method: 'DELETE' })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError('Failed to save settings')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/vacation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), days }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return { enabled, setEnabled, subject, setSubject, message, setMessage, days, setDays, loading, saving, saved, error, save }
}
