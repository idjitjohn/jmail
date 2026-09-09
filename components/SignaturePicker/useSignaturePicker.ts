'use client'

import { useState, useEffect } from 'react'
import { getSignatures, type Signature } from '@/lib/signatures'

export const useSignaturePicker = (
  userEmail: string,
  onChange: (id: string | null, html: string | null) => void,
) => {
  const [signatures, setSignatures] = useState<Signature[]>([])
  useEffect(() => {
    const refresh = () => setSignatures(getSignatures(userEmail))
    refresh()
    window.addEventListener('jmail:signatures', refresh)
    return () => window.removeEventListener('jmail:signatures', refresh)
  }, [userEmail])
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value || null
    const signature = signatures.find((item) => item.id === id)
    onChange(id, signature?.html ?? null)
  }
  return { signatures, handleChange }
}
