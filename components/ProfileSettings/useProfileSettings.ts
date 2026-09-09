'use client'

import { useSavedSetting } from '@/lib/useSavedSetting'

export const useProfileSettings = () => {
  const settings = useSavedSetting('/api/settings/profile', { name: '' })
  return {
    ...settings,
    name: settings.value.name,
    setName: (name: string) => settings.setValue({ name }),
    save: () => settings.save(),
  }
}
