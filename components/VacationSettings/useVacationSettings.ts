'use client'

import { useSavedSetting } from '@/lib/useSavedSetting'

export const useVacationSettings = () => {
  const state = useSavedSetting('/api/settings/vacation', {
    enabled: false,
    available: false,
    subject: '',
    message: '',
    days: 7,
  })
  const change = <K extends keyof typeof state.value>(
    key: K,
    value: (typeof state.value)[K],
  ) => state.setValue((current) => ({ ...current, [key]: value }))
  return {
    ...state,
    ...state.value,
    setEnabled: (update: boolean | ((value: boolean) => boolean)) =>
      change(
        'enabled',
        typeof update === 'function' ? update(state.value.enabled) : update,
      ),
    setSubject: (value: string) => change('subject', value),
    setMessage: (value: string) => change('message', value),
    setDays: (value: number) => change('days', value),
    save: () => {
      if (!state.value.available) return
      return state.value.enabled ? state.save() : state.save(null, 'DELETE')
    },
  }
}
