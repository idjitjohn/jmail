'use client'

import { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import type { Change, DiagnosticResult, Domain, ServerState } from './types'

const emptyDomain: Domain = {
  name: '',
  mxHost: '',
  ipv4: '',
  ipv6: '',
  selector: 'default',
}

const api = async <T>(url: string, body?: object): Promise<T> => {
  const response = await fetch(
    url,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { cache: 'no-store' },
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const useMailServerAdmin = (adminEmail: string) => {
  const [tab, setTab] = useState('domains')
  const [messageId, setMessageId] = useState('')
  const [activity, setActivity] = useState<
    { message: string; timestamp: string }[] | null
  >(null)
  const [history, setHistory] = useState<
    {
      id: string
      at: string
      mode: string
      target: string
      result: DiagnosticResult
    }[]
  >([])
  const [editingDomain, setEditingDomain] = useState(false)
  const [editingForward, setEditingForward] = useState(false)
  const previewRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<ServerState | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState<Domain>(emptyDomain)
  const [original, setOriginal] = useState('')
  const [preview, setPreview] = useState<{
    change: Change
    diff: string
    digest: string
  } | null>(null)
  const [forward, setForward] = useState({
    source: '',
    destination: '',
    keepCopy: true,
  })
  const [test, setTest] = useState({
    mode: 'dns',
    domain: '',
    email: adminEmail,
    password: '',
    recipient: '',
    token: '',
  })
  const [result, setResult] = useState<DiagnosticResult | null>(null)

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('tab')
    if (
      value &&
      ['domains', 'forwarding', 'diagnostics', 'activity'].includes(value)
    )
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL section hydration
      setTab(value)
  }, [])
  useEffect(() => {
    if (preview) {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      previewRef.current?.focus()
    }
  }, [preview])
  useEffect(() => {
    if (editingDomain) formRef.current?.querySelector('input')?.focus()
  }, [editingDomain])
  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api<ServerState>('/api/admin/mail-server')
      setState(data)
      setPreview(null)
      setTest((t) => ({
        ...t,
        domain: data.domains.some((d) => d.name === t.domain)
          ? t.domain
          : data.domains[0]?.name || '',
      }))
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Cannot connect to Maddy',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    api<ServerState>('/api/admin/mail-server')
      .then((data) => {
        if (cancelled) return
        setState(data)
        setTest((t) => ({ ...t, domain: data.domains[0]?.name || '' }))
      })
      .catch((error) => {
        if (!cancelled) setError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setBusy(false)
    }
  }

  const editDomain = (record?: Domain) => {
    setEditingDomain(true)
    setDomain(
      record
        ? { ...record }
        : {
            ...emptyDomain,
            mxHost: state?.domains[0]?.mxHost || '',
            ipv4: state?.domains[0]?.ipv4 || '',
            ipv6: state?.domains[0]?.ipv6 || '',
          },
    )
    setOriginal(record?.name || '')
    setPreview(null)
  }

  const updateDomain = (key: keyof Domain, value: string) => {
    setDomain((d) => ({ ...d, [key]: value }))
    setPreview(null)
  }

  const makePreview = async (change: Change) => {
    setPreview(null)
    await run(async () => {
      const data = await api<{ diff: string; digest: string }>(
        '/api/admin/mail-server',
        { ...change, action: 'preview' },
      )
      setPreview({ change, ...data })
    })
  }

  const previewDomain = (event: FormEvent) => {
    event.preventDefault()
    if (state)
      void makePreview({
        kind: 'domain',
        domain,
        original: original || undefined,
        revision: state.revision,
      })
  }

  const previewForward = (event: FormEvent) => {
    event.preventDefault()
    if (state)
      void makePreview({
        kind: 'forwarding',
        ...forward,
        revision: state.revision,
      })
  }

  const removeForward = (source: string) => {
    if (state)
      void makePreview({
        kind: 'forwarding',
        source,
        destination: '',
        keepCopy: true,
        revision: state.revision,
      })
  }

  const apply = () =>
    run(async () => {
      if (!preview) return
      const data = await api<ServerState>('/api/admin/mail-server', {
        ...preview.change,
        digest: preview.digest,
        action: 'apply',
      })
      setState(data)
      setPreview(null)
      setEditingDomain(false)
      setEditingForward(false)
      setNotice(
        'Configuration validated and applied. Maddy restarted successfully. Publish any new DNS records, then run the tests below.',
      )
    })

  const runTest = (event: FormEvent) => {
    event.preventDefault()
    setResult(null)
    void run(async () => {
      const data = await api<DiagnosticResult>('/api/admin/diagnostics', test)
      setResult(data)
      if (data.token) setTest((t) => ({ ...t, token: data.token! }))
      setTest((t) => ({ ...t, password: '' }))
    })
  }

  const loadActivity = () =>
    run(async () => {
      const data = await api<{
        entries: { message: string; timestamp: string }[]
      }>(`/api/admin/activity?messageId=${encodeURIComponent(messageId)}`)
      setActivity(data.entries)
    })
  const loadHistory = () =>
    run(async () => {
      const data = await api<{ history: typeof history }>(
        '/api/admin/diagnostics',
      )
      setHistory(data.history)
    })
  const generateToken = () => {
    setTest((t) => ({ ...t, token: `jmail-test-${crypto.randomUUID()}` }))
    setResult(null)
  }

  const selectTab = (value: string) => {
    setTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.replaceState(null, '', url)
  }
  const checkDomain = (name: string) => {
    selectTab('diagnostics')
    setTest((current) => ({ ...current, mode: 'dns', domain: name }))
    setResult(null)
    void run(async () => {
      setResult(
        await api<DiagnosticResult>('/api/admin/diagnostics', {
          mode: 'dns',
          domain: name,
        }),
      )
    })
  }
  const toggleFilters = () => {
    if (state)
      void makePreview({
        kind: 'filters',
        enabled: !state.filtersReady,
        revision: state.revision,
      })
  }
  const copyRecord = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setNotice('DNS record copied.')
    } catch {
      setError(
        'Select the record text to copy it. Clipboard access is unavailable.',
      )
    }
  }
  return {
    copyRecord,
    messageId,
    setMessageId,
    activity,
    loadActivity,
    history,
    loadHistory,
    setResult,
    toggleFilters,
    tab,
    selectTab,
    editingDomain,
    setEditingDomain,
    editingForward,
    setEditingForward,
    previewRef,
    formRef,
    checkDomain,
    state,
    error,
    notice,
    busy,
    loading,
    domain,
    original,
    preview,
    forward,
    test,
    result,
    refresh,
    editDomain,
    updateDomain,
    previewDomain,
    previewForward,
    removeForward,
    apply,
    runTest,
    setPreview,
    setForward,
    setTest,
    generateToken,
  }
}
