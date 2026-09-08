'use client'

import { useState, useEffect } from 'react'
import {
  type Theme,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
} from '@/lib/theme'

export function useThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser theme hydration
    setTheme(getStoredTheme())
  }, [])

  const toggle = () => {
    const next: Theme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
    setStoredTheme(next)
    applyTheme(next)
  }

  return { theme, toggle }
}
