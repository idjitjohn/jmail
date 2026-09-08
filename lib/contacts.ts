export type Contact = {
  id: string
  name: string
  email: string
  company: string
  phone: string
  group: string
}
export const parseContact = (input: unknown): Omit<Contact, 'id'> => {
  if (!input || typeof input !== 'object')
    throw new Error('Enter contact details.')
  const record = input as Record<string, unknown>
  const text = (key: string, max: number) => {
    const value = record[key] ?? ''
    if (
      typeof value !== 'string' ||
      value.length > max ||
      /[\r\n\x00]/.test(value)
    )
      throw new Error(`Invalid contact ${key}.`)
    return value.trim()
  }
  const email = text('email', 254).toLowerCase()
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
    throw new Error('Enter a valid email address.')
  return {
    email,
    name: text('name', 160),
    company: text('company', 160),
    phone: text('phone', 80),
    group: text('group', 80),
  }
}
