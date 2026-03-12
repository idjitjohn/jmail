'use client'

import { useState, useEffect } from 'react'

interface ForwardingConfig {
  active: boolean
  address: string | null
  keepCopy: boolean
}

export function useForwardingSettings() {
  const [enabled, setEnabled] = useState(false)
  const [forwardTo, setForwardTo] = useState('')
  const [keepCopy, setKeepCopy] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings/forwarding')
      .then(r => r.json())
      .then((data: ForwardingConfig) => {
        setEnabled(data.active)
        setForwardTo(data.address ?? '')
        setKeepCopy(data.keepCopy)
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
        await fetch('/api/settings/forwarding', { method: 'DELETE' })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError('Failed to save settings')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!forwardTo.trim()) {
      setError('Please enter a forwarding address')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forwardTo: forwardTo.trim(), keepCopy }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save settings')
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

  return {
    enabled, setEnabled,
    forwardTo, setForwardTo,
    keepCopy, setKeepCopy,
    loading, saving, saved, error,
    save,
  }
}
