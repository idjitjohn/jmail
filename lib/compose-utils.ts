export const toLocalDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const mentionsAttachment = (html: string) => {
  const text = html
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
    .replace(/<[^>]+>/g, ' ')
  return /\b(attach(?:ed|ment|ments|ing)?|enclosed)\b/i.test(text)
}

export const schedulePresets = (now = new Date()) => {
  const later = new Date(now.getTime() + 60 * 60 * 1000)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return [
    { label: 'In one hour', value: toLocalDateTime(later) },
    { label: 'Tomorrow, 9 AM', value: toLocalDateTime(tomorrow) },
  ]
}
