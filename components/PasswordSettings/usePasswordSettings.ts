'use client'

import { useState } from 'react'

export function usePasswordSettings() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    setSaved(false)

    if (!current || !next || !confirm) {
      setError('All fields are required')
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }
    if (next.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update password')
      } else {
        setSaved(true)
        setCurrent('')
        setNext('')
        setConfirm('')
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return { current, setCurrent, next, setNext, confirm, setConfirm, saving, saved, error, save }
}
