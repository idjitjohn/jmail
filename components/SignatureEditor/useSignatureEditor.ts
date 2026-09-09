'use client'

import { useState, useEffect } from 'react'
import type { Signature } from '@/lib/signatures'
import type { SignatureTemplate } from '@/lib/signatureTemplates'
import { safeHtml } from '@/lib/safe-html'

export const useSignatureEditor = (
  initial: Signature | null | undefined,
  onSave: (name: string, html: string) => void,
) => {
  const [sigName, setSigName] = useState(initial?.name ?? '')
  const [html, setHtml] = useState(initial?.html ?? '')
  const [tab, setTab] = useState<'templates' | 'code'>('templates')
  const [selectedTemplate, setSelectedTemplate] =
    useState<SignatureTemplate | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Signature selection synchronization
    setSigName(initial?.name ?? '')
    setHtml(initial?.html ?? '')
    setNameError('')
    setSelectedTemplate(null)
    setFields({})
    // If editing an existing signature, open on code tab
    if (initial?.html) setTab('code')
    else setTab('templates')
  }, [initial])

  const pickTemplate = (tpl: SignatureTemplate) => {
    setSelectedTemplate(tpl)
    const defaults: Record<string, string> = {}
    tpl.fields.forEach((f) => {
      if (f.type === 'color') defaults[f.key] = tpl.defaultColor ?? '#007aff'
    })
    setFields(defaults)
    setHtml(tpl.build(defaults))
  }

  const setField = (key: string, value: string) => {
    const updated = { ...fields, [key]: value }
    setFields(updated)
    if (selectedTemplate) setHtml(selectedTemplate.build(updated))
  }

  const handleSave = () => {
    if (!sigName.trim()) {
      setNameError('Name is required')
      return
    }
    if (!html.trim()) return
    onSave(sigName.trim(), safeHtml(html.trim()))
  }

  const previewHtml =
    html ||
    '<p style="color:#aeaeb2;font-family:sans-serif;font-size:13px">Preview will appear here</p>'

  return {
    sigName,
    setSigName,
    html,
    setHtml,
    tab,
    setTab,
    selectedTemplate,
    setSelectedTemplate,
    fields,
    nameError,
    setNameError,
    pickTemplate,
    setField,
    handleSave,
    previewHtml: safeHtml(previewHtml),
  }
}
