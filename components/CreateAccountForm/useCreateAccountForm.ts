'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../Toast'

export const useCreateAccountForm = (domains: string[]) => {
  const router = useRouter()
  const { toast } = useToast()
  const [local, setLocal] = useState('')
  const [domain, setDomain] = useState(domains[0] || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!domain) e.domain = 'Add a domain in Mail server first'
    if (!local.trim()) e.local = 'Required'
    else if (!/^[a-zA-Z0-9._%+\-]+$/.test(local)) e.local = 'Invalid characters'
    if (password.length < 8) e.password = 'Minimum 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${local}@${domain}`, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(`Created ${local}@${domain}`, 'success')
      router.push('/admin/accounts')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create account', 'error')
    } finally {
      setLoading(false)
    }
  }

  return { local, setLocal, domain, setDomain, password, setPassword, confirm, setConfirm, loading, errors, handleSubmit, back: () => router.back() }
}
