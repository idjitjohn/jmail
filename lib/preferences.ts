export type MailPreferences = {
  desktopNotifications: boolean
  undoSendSeconds: 0 | 5 | 8 | 10 | 30
  attachmentReminder: boolean
  markReadOnOpen: boolean
  keyboardShortcuts: boolean
  swipeToDelete: boolean
  density: 'comfortable' | 'compact'
  showPreviews: boolean
  readingSize: 'standard' | 'large'
}

export const defaultPreferences: Readonly<MailPreferences> = {
  desktopNotifications: false,
  undoSendSeconds: 8,
  attachmentReminder: true,
  markReadOnOpen: true,
  keyboardShortcuts: true,
  swipeToDelete: true,
  density: 'comfortable',
  showPreviews: true,
  readingSize: 'standard',
}

const allowedValues: Record<keyof MailPreferences, readonly unknown[]> = {
  desktopNotifications: [true, false],
  undoSendSeconds: [0, 5, 8, 10, 30],
  attachmentReminder: [true, false],
  markReadOnOpen: [true, false],
  keyboardShortcuts: [true, false],
  swipeToDelete: [true, false],
  density: ['comfortable', 'compact'],
  showPreviews: [true, false],
  readingSize: ['standard', 'large'],
}

export const normalizePreferences = (input: unknown): MailPreferences => {
  const preferences = { ...defaultPreferences }
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return preferences
  for (const key of Object.keys(
    defaultPreferences,
  ) as (keyof MailPreferences)[]) {
    const value = (input as Record<string, unknown>)[key]
    if (allowedValues[key].includes(value))
      Object.assign(preferences, { [key]: value })
  }
  return preferences
}

export const parsePreferencePatch = (
  input: unknown,
): Partial<MailPreferences> => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Choose a valid preference.')
  const entries = Object.entries(input)
  if (
    !entries.length ||
    entries.some(
      ([key, value]) =>
        !Object.hasOwn(allowedValues, key) ||
        !allowedValues[key as keyof MailPreferences].includes(value),
    )
  ) {
    throw new Error('One or more preferences are invalid.')
  }
  return Object.fromEntries(entries) as Partial<MailPreferences>
}
