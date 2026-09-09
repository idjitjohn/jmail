'use client'

import { useState, useEffect } from 'react'
import {
  type Signature,
  getSignatures,
  getLegacySignatures,
  saveSignatures,
  createSignature,
} from '@/lib/signatures'
import { useToast } from '../Toast'

export function useSignatureManager(userEmail: string) {
  const { toast } = useToast()
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [editing, setEditing] = useState<Signature | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [legacy, setLegacy] = useState<Signature[]>([])

  useEffect(() => {
    const current = getSignatures(userEmail)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser signature hydration
    setSignatures(current)
    setLegacy(
      getLegacySignatures().filter(
        (row) => !current.some((item) => item.id === row.id),
      ),
    )
  }, [userEmail])

  const persist = (updated: Signature[]) => {
    try {
      saveSignatures(updated, userEmail)
      setSignatures(updated)
      return true
    } catch {
      toast(
        'Could not save signatures in this browser. Your previous signatures are unchanged.',
        'error',
      )
      return false
    }
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
      if (
        !persist(
          signatures.map((s) =>
            s.id === editing.id ? { ...s, name, html } : s,
          ),
        )
      )
        return
    } else {
      if (!persist([...signatures, createSignature(name, html)])) return
    }
    setEditing(null)
    setIsCreating(false)
  }

  const remove = (id: string) => {
    persist(signatures.filter((s) => s.id !== id))
  }

  return {
    signatures,
    hasLegacy: legacy.length > 0,
    importLegacy: () => {
      if (persist([...signatures, ...legacy])) setLegacy([])
    },
    editing,
    isCreating,
    startCreate,
    startEdit,
    cancelEditor,
    save,
    remove,
  }
}
