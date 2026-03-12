'use client'

export interface DraftData {
  to: string
  cc: string
  subject: string
  bodyHtml: string
  signatureId: string | null
}

const KEY = 'jmail-compose-draft'

export function saveDraft(draft: DraftData): void {
  localStorage.setItem(KEY, JSON.stringify(draft))
}

export function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DraftData) : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY)
}
