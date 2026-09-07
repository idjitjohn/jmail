'use client'

import { useEffect, useMemo, useState } from 'react'
import { starterTemplates, type ReplyTemplate } from '@/lib/reply-templates'

export const useReplyTemplates = () => {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([])
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/settings/templates', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load your saved replies.')
        const data = await res.json()
        if (!controller.signal.aborted) setTemplates(data.templates)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [retry])

  const filtered = useMemo(
    () =>
      [
        ...templates.map((template) => ({ ...template, custom: true })),
        ...starterTemplates.map((template) => ({ ...template, custom: false })),
      ].filter((template) =>
        `${template.name} ${template.body}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [templates, query],
  )

  const save = async () => {
    if (busy || !name.trim() || !body.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save your reply.')
      setTemplates((prev) => [...prev, data.template])
      setCreating(false)
      setName('')
      setBody('')
      setQuery('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your reply.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Could not delete this reply.')
      setTemplates((prev) => prev.filter((template) => template.id !== id))
      setDeleting(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this reply.')
    } finally {
      setBusy(false)
    }
  }

  return {
    filtered,
    query,
    setQuery,
    creating,
    setCreating,
    name,
    setName,
    body,
    setBody,
    error,
    loading,
    busy,
    deleting,
    setDeleting,
    save,
    remove,
    retry: () => {
      setLoading(true)
      setError('')
      setRetry((value) => value + 1)
    },
  }
}
