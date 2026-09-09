'use client'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'jmail-theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* Unavailable browser storage */
  }
}

export function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme): void {
  const resolved = getResolvedTheme(theme)
  document.documentElement.setAttribute('data-theme', resolved)
}

export function initTheme(): void {
  const theme = getStoredTheme()
  applyTheme(theme)
}
