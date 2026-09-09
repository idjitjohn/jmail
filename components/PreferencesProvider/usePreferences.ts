'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { normalizePreferences, type MailPreferences } from '@/lib/preferences'
import type { PreferencesContextValue } from './types'

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
)

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('PreferencesProvider is required')
  return context
}

export const usePreferencesProvider = (
  initial: MailPreferences,
  initialError: string,
) => {
  const [preferences, setPreferences] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(initialError)
  const locked = useRef(false)

  const update = async (patch: Partial<MailPreferences>) => {
    if (locked.current) return
    locked.current = true
    const previous = preferences
    setPreferences({ ...previous, ...patch })
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (res.status === 401)
        throw new Error(
          'Your session has expired. Sign in again to save your preferences.',
        )
      if (res.status === 403)
        throw new Error(
          'This change was blocked. Reload JMail and try again. Your previous preference has been restored.',
        )
      if (!res.ok || !data?.preferences)
        throw new Error(
          'Could not save this change. Your previous preference has been restored.',
        )
      setPreferences(normalizePreferences(data.preferences))
      setSaved(true)
    } catch (error) {
      setPreferences(previous)
      setError(
        error instanceof Error
          ? error.message
          : 'Could not save your preferences.',
      )
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  const retry = async () => {
    if (locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/settings/preferences')
      if (!res.ok)
        throw new Error('Could not load your preferences. Please try again.')
      const data = await res.json()
      setPreferences(normalizePreferences(data.preferences))
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not load your preferences.',
      )
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  return { preferences, saving, saved, error, update, retry }
}
