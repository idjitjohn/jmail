import { enUS } from './enUS'
import { frFR } from './frFR'
import { languageTags, type Locale } from './config'

export type TranslationValues = Record<string, string | number>
const messages: Record<Locale, Record<string, string>> = { enUS, frFR }
const patterns = Object.keys(enUS)
  .filter((key) => /\{\w+\}/.test(key))
  .map((key) => {
    const names: string[] = []
    const pattern = key
      .split(/(\{\w+\})/)
      .map((part) => {
        if (/^\{\w+\}$/.test(part)) {
          names.push(part.slice(1, -1))
          return '([\\s\\S]+?)'
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      })
      .join('')
    return { key, names, expression: new RegExp(`^${pattern}$`) }
  })

const interpolate = (text: string, values: TranslationValues) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) =>
    String(values[name] ?? match),
  )

export const translate = (
  locale: Locale,
  text: string,
  values: TranslationValues = {},
): string => {
  if (Object.hasOwn(messages[locale], text))
    return interpolate(messages[locale][text], values)
  // Formatted API errors and notifications
  if (locale !== 'enUS') {
    for (const pattern of patterns) {
      const match = pattern.expression.exec(text)
      if (match)
        return interpolate(
          messages[locale][pattern.key],
          Object.fromEntries(
            pattern.names.map((name, index) => [name, match[index + 1]]),
          ),
        )
    }
  }
  return interpolate(text, values)
}

export const createTranslator =
  (locale: Locale) => (text: string, values?: TranslationValues) =>
    translate(locale, text, values)

export const translatePlural = (
  locale: Locale,
  one: string,
  other: string,
  count: number,
  values: TranslationValues = {},
) =>
  translate(
    locale,
    new Intl.PluralRules(languageTags[locale]).select(count) === 'one'
      ? one
      : other,
    {
      ...values,
      count: new Intl.NumberFormat(languageTags[locale]).format(count),
    },
  )
