'use client'

import { useId } from 'react'
import { useLocale } from '../LocaleProvider/useLocale'
import { isLocale } from '@/lib/i18n/config'

export const useLanguageSelector = () => {
  const { locale, setLocale, saving, error, t } = useLocale()
  const id = useId()
  return {
    locale,
    saving,
    error,
    t,
    id,
    change: (value: string) => {
      if (isLocale(value)) void setLocale(value)
    },
  }
}
