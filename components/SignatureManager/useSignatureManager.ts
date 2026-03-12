'use client'

import { useState, useEffect } from 'react'
import {
  type Signature,
  getSignatures,
  saveSignatures,
  createSignature,
} from '@/lib/signatures'

export function useSignatureManager() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [editing, setEditing] = useState<Signature | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setSignatures(getSignatures())
  }, [])

  const persist = (updated: Signature[]) => {
    setSignatures(updated)
    saveSignatures(updated)
  }

  const startCreate = () => {
    setEditing(null)
    setIsCreating(true)
  }

  const startEdit = (sig: Signature) => {
    setEditing(sig)
    setIsCreating(true)
  }

  const cancelEditor = () => {
    setEditing(null)
    setIsCreating(false)
  }

  const save = (name: string, html: string) => {
    if (editing) {
      persist(signatures.map(s => s.id === editing.id ? { ...s, name, html } : s))
    } else {
      persist([...signatures, createSignature(name, html)])
    }
    setEditing(null)
    setIsCreating(false)
  }

  const remove = (id: string) => {
    persist(signatures.filter(s => s.id !== id))
  }

  return {
    signatures,
    editing,
    isCreating,
    startCreate,
    startEdit,
    cancelEditor,
    save,
    remove,
  }
}
