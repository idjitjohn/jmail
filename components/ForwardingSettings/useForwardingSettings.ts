'use client'

import { useState, useEffect } from 'react'

import type { ForwardingConfig } from './types'

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
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load settings')
        return data
      })
      .then((data: ForwardingConfig) => {
        setEnabled(data.active)
        setForwardTo(data.address ?? '')
        setKeepCopy(data.keepCopy)
      })
      .catch(error => setError(error instanceof Error ? error.message : 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError('')
    setSaved(false)

    if (!enabled) {
      setSaving(true)
      try {
        const response = await fetch('/api/settings/forwarding', { method: 'DELETE' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to save settings')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to save settings')
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
