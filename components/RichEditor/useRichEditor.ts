'use client'

import { useLocale } from '../LocaleProvider/useLocale'
import { useRef, useEffect, useState, useCallback } from 'react'
import { safeHtml } from '@/lib/safe-html'
import { templateToHtml } from '@/lib/reply-templates'
import type { EditorOptions } from './types'

export const useRichEditor = ({
  defaultValue,
  resetToken,
  onChange,
}: EditorOptions) => {
  const { t } = useLocale()
  const divRef = useRef<HTMLDivElement>(null)
  const prevToken = useRef(-1)
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  })
  const [inLink, setInLink] = useState(false)

  // Set initial content on mount
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = safeHtml(defaultValue)
      prevToken.current = resetToken
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External reset (init / draft restore)
  useEffect(() => {
    if (resetToken !== prevToken.current && divRef.current) {
      divRef.current.innerHTML = safeHtml(defaultValue)
      prevToken.current = resetToken
    }
  }, [resetToken, defaultValue])

  // Track toolbar active states on selection change
  useEffect(() => {
    const update = () => {
      if (document.activeElement !== divRef.current) return
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      })
      const anchor = window.getSelection()?.anchorNode
      setInLink(!!anchor?.parentElement?.closest('a'))
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  const exec = useCallback(
    (cmd: string, value?: string) => {
      divRef.current?.focus()
      document.execCommand(cmd, false, value)
      if (divRef.current) onChange(safeHtml(divRef.current.innerHTML))
    },
    [onChange],
  )

  const toggleLink = useCallback(() => {
    if (inLink) {
      exec('unlink')
      return
    }
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    const url = window.prompt(t('Enter URL:'), 'https://')
    if (!url || !/^(https?:|mailto:|tel:)/i.test(url.trim())) return
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('createLink', false, url)
    // Ensure links open in new tab
    divRef.current?.querySelectorAll('a').forEach((a) => {
      if (!a.getAttribute('target')) {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      }
    })
    if (divRef.current) onChange(safeHtml(divRef.current.innerHTML))
  }, [exec, inLink, onChange, t])

  const handleInput = useCallback(() => {
    if (divRef.current) onChange(safeHtml(divRef.current.innerHTML))
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleLink()
      }
    },
    [toggleLink],
  )

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const html =
      event.clipboardData.getData('text/html') ||
      templateToHtml(event.clipboardData.getData('text/plain'))
    exec('insertHTML', safeHtml(html))
  }

  return {
    divRef,
    formats,
    inLink,
    exec,
    toggleLink,
    handleInput,
    handleKeyDown,
    handlePaste,
  }
}
