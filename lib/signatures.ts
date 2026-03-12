export interface Signature {
  id: string
  name: string
  html: string
  createdAt: string
}

const STORAGE_KEY = 'jmail-signatures'

export function getSignatures(): Signature[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSignatures(sigs: Signature[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs))
}

export function createSignature(name: string, html: string): Signature {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    html,
    createdAt: new Date().toISOString(),
  }
}
