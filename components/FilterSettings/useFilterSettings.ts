'use client'

import { useSavedSetting } from '@/lib/useSavedSetting'
import type { SieveFilter } from '@/lib/sieve'

export const useFilterSettings = () => {
  const state = useSavedSetting('/api/settings/filters', {
    filters: [] as SieveFilter[],
    active: false,
  })
  return {
    ...state,
    ...state.value,
    addFilter: () =>
      state.setValue((current) => ({
        ...current,
        filters: [
          ...current.filters,
          {
            id: crypto.randomUUID(),
            field: 'from',
            contains: '',
            action: 'move',
            destination: '',
            enabled: true,
          },
        ],
      })),
    updateFilter: (id: string, patch: Partial<SieveFilter>) =>
      state.setValue((current) => ({
        ...current,
        filters: current.filters.map((filter) =>
          filter.id === id ? { ...filter, ...patch } : filter,
        ),
      })),
    removeFilter: (id: string) =>
      state.setValue((current) => ({
        ...current,
        filters: current.filters.filter((filter) => filter.id !== id),
      })),
    save: () => state.save({ filters: state.value.filters }, 'PUT'),
  }
}
