'use client'

import { useState, useEffect } from 'react'
import { getSignatures, type Signature } from '@/lib/signatures'
import './SignaturePicker.scss'

interface Props {
  value: string | null
  onChange: (id: string | null, html: string | null) => void
  onManage: () => void
}

export default function SignaturePicker({ value, onChange, onManage }: Props) {
  const [signatures, setSignatures] = useState<Signature[]>([])

  useEffect(() => {
    setSignatures(getSignatures())
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null
    const sig = signatures.find(s => s.id === id) ?? null
    onChange(id, sig?.html ?? null)
  }

  return (
    <div className="SignaturePicker">
      <select className="select" value={value ?? ''} onChange={handleChange}>
        <option value="">No signature</option>
        {signatures.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button className="manage-btn" onClick={onManage} type="button" title="Manage signatures" />
    </div>
  )
}
