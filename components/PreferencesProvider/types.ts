import type { MailPreferences } from '@/lib/preferences'

export type PreferencesContextValue = {
  preferences: MailPreferences
  saving: boolean
  saved: boolean
  error: string
  update: (patch: Partial<MailPreferences>) => Promise<void>
  retry: () => Promise<void>
}
