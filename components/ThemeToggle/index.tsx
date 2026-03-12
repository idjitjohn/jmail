'use client'

import { useThemeToggle } from './useThemeToggle'
import './ThemeToggle.scss'

export default function ThemeToggle() {
  const { theme, toggle } = useThemeToggle()

  return (
    <button className={`ThemeToggle theme-${theme}`} onClick={toggle} title={`Theme: ${theme}`} type="button" />
  )
}
