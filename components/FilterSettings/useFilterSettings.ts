'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SieveFilter } from '@/lib/sieve'

export function useFilterSettings() {
  const [filters, setFilters] = useState<SieveFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/filters')
      .then(r => r.json())
      .then(d => setFilters(d.filters || []))
      .catch(() => setError('Failed to load filters'))
      .finally(() => setLoading(false))
  }, [])

  const addFilter = useCallback(() => {
    setFilters(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        field: 'from',
        contains: '',
        action: 'move',
        destination: '',
        enabled: true,
      },
    ])
    setSaved(false)
  }, [])

  const updateFilter = useCallback((id: string, patch: Partial<SieveFilter>) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
    setSaved(false)
  }, [])

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id))
    setSaved(false)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/settings/filters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
    } catch {
      setError('Failed to save filters')
    } finally {
      setSaving(false)
    }
  }, [filters])

  return { filters, loading, saving, error, saved, addFilter, updateFilter, removeFilter, save }
}
