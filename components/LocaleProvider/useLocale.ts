'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  isLocale,
  languageTags,
  localeCookie,
  type Locale,
} from '@/lib/i18n/config'
import { createTranslator, translatePlural } from '@/lib/i18n/translate'
import { formatDate, formatFullDate, formatBytes } from '@/lib/format'
import { readApiResponse } from '@/lib/api-client'
import type { LocaleContextValue } from './types'

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('LocaleProvider is required')
  return context
}

export const useLocaleProvider = (
  initialLocale: Locale,
  authenticated: boolean,
) => {
  const router = useRouter()
  const [locale, updateLocale] = useState(initialLocale)
  const [timeZone, setTimeZone] = useState('UTC')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Server preference synchronization
    updateLocale(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser time zone after hydration
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  useEffect(() => {
    document.documentElement.lang = languageTags[locale]
  }, [locale])

  const setLocale = useCallback(
    async (next: Locale) => {
      if (!isLocale(next) || locked.current || next === locale) return
      locked.current = true
      setSaving(true)
      setError('')
      try {
        if (authenticated) {
          const data = await readApiResponse<{
            preferences?: { locale?: Locale }
          }>(
            await fetch('/api/settings/preferences', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locale: next }),
            }),
            'Could not save your language. Please try again.',
          )
          if (data.preferences?.locale !== next)
            throw new Error('Could not save your language. Please try again.')
        }
        document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
        updateLocale(next)
        router.refresh()
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save your language. Please try again.',
        )
      } finally {
        locked.current = false
        setSaving(false)
      }
    },
    [authenticated, locale, router],
  )

  return useMemo<LocaleContextValue>(
    () => ({
      locale,
      languageTag: languageTags[locale],
      saving,
      error,
      setLocale,
      t: createTranslator(locale),
      plural: (one, other, count, values) =>
        translatePlural(locale, one, other, count, values),
      number: (value) =>
        new Intl.NumberFormat(languageTags[locale]).format(value),
      dateTime: (
        value,
        options = { dateStyle: 'medium', timeStyle: 'short' },
      ) => {
        const date = new Date(value)
        return Number.isNaN(date.getTime())
          ? '—'
          : new Intl.DateTimeFormat(languageTags[locale], {
              ...options,
              timeZone,
            }).format(date)
      },
      formatDate: (value) => formatDate(value, locale, timeZone),
      formatFullDate: (value) => formatFullDate(value, locale, timeZone),
      formatBytes: (value) => formatBytes(value, locale),
    }),
    [locale, timeZone, saving, error, setLocale],
  )
}
