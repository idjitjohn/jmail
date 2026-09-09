export const locales = ['enUS', 'frFR'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'enUS'
export const localeCookie = 'jmail-locale'
export const languageTags: Record<Locale, string> = {
  enUS: 'en-US',
  frFR: 'fr-FR',
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && locales.includes(value as Locale)

export const preferredLocale = (header: string | null): Locale => {
  const languages = (header || '')
    .split(',')
    .map((entry, order) => {
      const [tag, ...parameters] = entry.trim().split(';')
      const weight = parameters.find((value) => value.trim().startsWith('q='))
      return {
        tag: tag.toLowerCase(),
        quality: weight ? Number(weight.trim().slice(2)) : 1,
        order,
      }
    })
    .filter(
      (item) =>
        Number.isFinite(item.quality) && item.quality > 0 && item.quality <= 1,
    )
    .sort((a, b) => b.quality - a.quality || a.order - b.order)
  for (const { tag } of languages) {
    if (tag === 'fr' || tag.startsWith('fr-')) return 'frFR'
    if (tag === 'en' || tag.startsWith('en-')) return 'enUS'
  }
  return defaultLocale
}
