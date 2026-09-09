'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useThemeToggle } from './useThemeToggle'
import './ThemeToggle.scss'

export default function ThemeToggle() {
  const { t } = useLocale()

  const { theme, toggle } = useThemeToggle()

  return (
    <button
      className={`ThemeToggle theme-${theme}`}
      onClick={toggle}
      title={t('Theme: {0}', { '0': t(theme) })}
      type="button"
    />
  )
}
