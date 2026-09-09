'use client'

import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { LocaleContext, useLocaleProvider } from './useLocale'

type Props = {
  children: ReactNode
  initialLocale: Locale
  authenticated: boolean
}

const LocaleProvider = ({ children, initialLocale, authenticated }: Props) => {
  const value = useLocaleProvider(initialLocale, authenticated)
  return <LocaleContext value={value}>{children}</LocaleContext>
}

export default LocaleProvider
