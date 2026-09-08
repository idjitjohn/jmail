'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { usePreferences } from '../PreferencesProvider/usePreferences'
import type { Command } from './types'

export const useCommandPalette = (commands: Command[], onClose: () => void) => {
  const { preferences } = usePreferences()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const filtered = useMemo(
    () =>
      commands.filter((command) =>
        `${command.label} ${command.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [commands, query],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  useEffect(() => {
    document
      .getElementById(`command-${filtered[active]?.id}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, filtered])

  const run = (command: Command) => {
    dialogRef.current?.close()
    onClose()
    command.run()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) =>
        filtered.length
          ? (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) %
            filtered.length
          : 0,
      )
    }
    if (event.key === 'Enter' && filtered[active]) {
      event.preventDefault()
      run(filtered[active])
    }
  }

  return {
    shortcutsEnabled: preferences.keyboardShortcuts,
    dialogRef,
    query,
    setQuery: (value: string) => {
      setQuery(value)
      setActive(0)
    },
    active,
    setActive,
    filtered,
    run,
    handleKeyDown,
  }
}
