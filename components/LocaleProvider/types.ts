import type { Locale } from '@/lib/i18n/config'
import type { TranslationValues } from '@/lib/i18n/translate'

export type LocaleContextValue = {
  locale: Locale
  languageTag: string
  saving: boolean
  error: string
  setLocale: (locale: Locale) => Promise<void>
  t: (text: string, values?: TranslationValues) => string
  plural: (
    one: string,
    other: string,
    count: number,
    values?: TranslationValues,
  ) => string
  number: (value: number) => string
  dateTime: (
    value: string | number | Date,
    options?: Intl.DateTimeFormatOptions,
  ) => string
  formatDate: (value: string) => string
  formatFullDate: (value: string) => string
  formatBytes: (value: number) => string
}
