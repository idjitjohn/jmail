'use client'

import { useSavedSetting } from '@/lib/useSavedSetting'

export const useSignatureSettings = () => {
  const settings = useSavedSetting('/api/settings/signature', { signature: '' })
  return {
    ...settings,
    signature: settings.value.signature,
    setSignature: (signature: string) => settings.setValue({ signature }),
    save: () => settings.save(),
  }
}
