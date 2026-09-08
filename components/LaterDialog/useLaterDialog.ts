'use client'
import { useState } from 'react'
import { schedulePresets } from '@/lib/compose-utils'
import type { MailMessage } from '@/lib/types'
export const useLaterDialog = (
  message: MailMessage,
  mode: 'snooze' | 'reminder',
  onSaved: () => void,
) => {
  const [dueAt, setDueAt] = useState(() => schedulePresets()[1].value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/messages/later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          dueAt: new Date(dueAt).toISOString(),
          folder: message.folder,
          uid: message.uid,
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || 'Could not save this reminder.')
      onSaved()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not save this reminder.',
      )
    } finally {
      setBusy(false)
    }
  }
  return { dueAt, setDueAt, busy, error, save, presets: schedulePresets() }
}
