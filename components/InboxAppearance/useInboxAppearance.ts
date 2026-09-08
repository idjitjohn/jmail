'use client'

import { usePreferences } from '../PreferencesProvider/usePreferences'
import type { MailPreferences } from '@/lib/preferences'

export const useInboxAppearance = () => {
  const { preferences, saving, update } = usePreferences()
  return {
    preferences,
    saving,
    setDensity: (density: MailPreferences['density']) => update({ density }),
    setPreviews: (showPreviews: boolean) => update({ showPreviews }),
    setReadingSize: (readingSize: MailPreferences['readingSize']) =>
      update({ readingSize }),
  }
}
