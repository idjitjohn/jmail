'use client'

import type { ReactNode } from 'react'
import type { MailPreferences } from '@/lib/preferences'
import { PreferencesContext, usePreferencesProvider } from './usePreferences'

type Props = {
  children: ReactNode
  initialPreferences: MailPreferences
  initialError?: string
}

const PreferencesProvider = ({
  children,
  initialPreferences,
  initialError = '',
}: Props) => {
  const value = usePreferencesProvider(initialPreferences, initialError)
  return <PreferencesContext value={value}>{children}</PreferencesContext>
}

export default PreferencesProvider
