'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../LocaleProvider/useLocale'
import type { MailAction } from './types'

export const useMailActionMenu = () => {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])

  return {
    t,
    open,
    rootRef,
    triggerRef,
    panelId,
    toggle: () => setOpen((previous) => !previous),
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    },
    choose: (action: MailAction) => {
      setOpen(false)
      triggerRef.current?.focus()
      action.onClick?.()
    },
  }
}
