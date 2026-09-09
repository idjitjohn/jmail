import { safeHtml } from './safe-html'

export type Signature = {
  id: string
  name: string
  html: string
  createdAt: string
}

const STORAGE_KEY = 'jmail-signatures'

export function getSignatures(email: string): Signature[] {
  if (typeof window === 'undefined') return []
  try {
    const rows = JSON.parse(
      localStorage.getItem(`${STORAGE_KEY}:${email}`) || '[]',
    )
    return Array.isArray(rows)
      ? rows
          .filter(
            (row) =>
              row &&
              typeof row.id === 'string' &&
              typeof row.name === 'string' &&
              typeof row.html === 'string',
          )
          .map((row) => ({ ...row, html: safeHtml(row.html) }))
      : []
  } catch {
    return []
  }
}

export const getLegacySignatures = (): Signature[] => {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(rows)
      ? rows
          .filter(
            (row) =>
              row &&
              typeof row.id === 'string' &&
              typeof row.name === 'string' &&
              typeof row.html === 'string',
          )
          .map((row) => ({ ...row, html: safeHtml(row.html) }))
      : []
  } catch {
    return []
  }
}

export function saveSignatures(sigs: Signature[], email: string): void {
  localStorage.setItem(
    `${STORAGE_KEY}:${email}`,
    JSON.stringify(sigs.map((sig) => ({ ...sig, html: safeHtml(sig.html) }))),
  )
  window.dispatchEvent(new Event('jmail:signatures'))
}

export function createSignature(name: string, html: string): Signature {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    html,
    createdAt: new Date().toISOString(),
  }
}
