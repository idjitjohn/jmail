'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readApiResponse } from './api-client'

export const useSavedSetting = <T extends object>(url: string, initial: T) => {
  const [value, setValue] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const locked = useRef(false)
  const changes = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setReady(false)
      setError('')
      try {
        const data = await readApiResponse<T>(
          await fetch(url, { signal: controller.signal }),
          'Could not load these settings. Try reloading them.',
        )
        if (!controller.signal.aborted) {
          setValue(data)
          setReady(true)
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : 'Could not load settings.',
          )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [url, reloadKey])

  const change = useCallback((update: React.SetStateAction<T>) => {
    changes.current += 1
    setValue(update)
    setSaved(false)
  }, [])

  const save = async (body: unknown = value, method = 'POST') => {
    if (locked.current) return false
    if (!ready) {
      setError(
        'Reload your settings before saving to avoid replacing an existing value.',
      )
      return false
    }
    locked.current = true
    const submitted = changes.current
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await readApiResponse(
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(body === null ? {} : { body: JSON.stringify(body) }),
        }),
        'Could not save these settings. Please try again.',
      )
      setSaved(submitted === changes.current)
      return true
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not save settings.',
      )
      return false
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  return {
    value,
    setValue: change,
    loading,
    saving,
    saved,
    error,
    setError,
    ready,
    save,
    reload: () => setReloadKey((key) => key + 1),
  }
}
