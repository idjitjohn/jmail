'use client'

export type DraftData = {
  to: string
  cc: string
  subject: string
  bodyHtml: string
  signatureId: string | null
  inReplyTo?: string
}

const key = (email: string) => `jmail-compose-draft:${email}`

export const saveDraft = (draft: DraftData, email: string): boolean => {
  try {
    localStorage.setItem(key(email), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export const loadDraft = (email: string): DraftData | null => {
  try {
    const raw = localStorage.getItem(key(email))
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (
      ![draft.to, draft.cc, draft.subject, draft.bodyHtml].every(
        (value) => typeof value === 'string',
      )
    )
      return null
    return draft
  } catch {
    return null
  }
}

export const clearDraft = (email: string): void => {
  try {
    localStorage.removeItem(key(email))
  } catch {
    /* Unavailable storage */
  }
}
