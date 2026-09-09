import { languageTags, type Locale } from './i18n/config'
import { translate } from './i18n/translate'

export const formatDate = (
  dateStr: string,
  locale: Locale = 'enUS',
  timeZone = 'UTC',
): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  const now = new Date()
  const calendar = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  })
  const dayNumber = (value: Date) => {
    const parts = calendar.formatToParts(value)
    const field = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value)
    return Date.UTC(field('year'), field('month') - 1, field('day')) / 86400000
  }
  const days = dayNumber(now) - dayNumber(date)
  const options: Intl.DateTimeFormatOptions = { timeZone }
  if (days === 0) Object.assign(options, { hour: '2-digit', minute: '2-digit' })
  else if (days === 1) return translate(locale, 'Yesterday')
  else if (days > 1 && days < 7) options.weekday = 'short'
  else
    Object.assign(options, {
      month: 'short',
      day: 'numeric',
      ...(date.getUTCFullYear() !== now.getUTCFullYear()
        ? { year: 'numeric' }
        : {}),
    })
  return new Intl.DateTimeFormat(languageTags[locale], options).format(date)
}

export const formatFullDate = (
  dateStr: string,
  locale: Locale = 'enUS',
  timeZone = 'UTC',
): string => {
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(languageTags[locale], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
      }).format(date)
}

// Extract initials from name or email
export function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

// Consistent color from string (for avatars)
export function getAvatarColor(str: string): string {
  const colors = [
    '#007aff',
    '#34c759',
    '#ff9500',
    '#ff3b30',
    '#af52de',
    '#ff2d55',
    '#5ac8fa',
    '#ffcc00',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function formatAddress(addr: {
  name?: string
  address: string
}): string {
  if (addr.name) return `${addr.name} <${addr.address}>`
  return addr.address
}

// Strip HTML tags to plain text for email text/plain fallback
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const formatBytes = (bytes: number, locale: Locale = 'enUS'): string => {
  const safe = Math.max(0, Number.isFinite(bytes) ? bytes : 0)
  const index = safe < 1024 ? 0 : safe < 1024 * 1024 ? 1 : 2
  const value = safe / 1024 ** index
  const unit = (locale === 'frFR' ? ['o', 'Ko', 'Mo'] : ['B', 'KB', 'MB'])[
    index
  ]
  return `${new Intl.NumberFormat(languageTags[locale], { minimumFractionDigits: index ? 1 : 0, maximumFractionDigits: index ? 1 : 0 }).format(value)} ${unit}`
}
