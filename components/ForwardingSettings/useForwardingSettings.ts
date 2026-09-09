'use client'

import { useSavedSetting } from '@/lib/useSavedSetting'
import type { ForwardingConfig } from './types'

export const useForwardingSettings = () => {
  const state = useSavedSetting<ForwardingConfig>('/api/settings/forwarding', {
    active: false,
    address: '',
    keepCopy: true,
  })
  return {
    ...state,
    enabled: state.value.active,
    forwardTo: state.value.address || '',
    keepCopy: state.value.keepCopy,
    setEnabled: (update: boolean | ((value: boolean) => boolean)) =>
      state.setValue((current) => ({
        ...current,
        active: typeof update === 'function' ? update(current.active) : update,
      })),
    setForwardTo: (address: string) =>
      state.setValue((current) => ({ ...current, address })),
    setKeepCopy: (update: boolean | ((value: boolean) => boolean)) =>
      state.setValue((current) => ({
        ...current,
        keepCopy:
          typeof update === 'function' ? update(current.keepCopy) : update,
      })),
    save: () =>
      state.value.active
        ? state.save({
            forwardTo: state.value.address?.trim(),
            keepCopy: state.value.keepCopy,
          })
        : state.save(null, 'DELETE'),
  }
}
