'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '../Input'
import Button from '../Button'
import { useToast } from '../Toast'
import { DOMAINS } from '@/lib/admin'
import './CreateAccountForm.scss'

export default function CreateAccountForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [local, setLocal] = useState('')
  const [domain, setDomain] = useState(DOMAINS[0])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
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

  return (
    <form className="CreateAccountForm" onSubmit={handleSubmit}>
      <div className="email-row">
        <div className="local-wrap">
          <Input
            label="Local part"
            placeholder="username"
            value={local}
            onChange={e => setLocal(e.target.value)}
            error={errors.local}
            autoFocus
            required
          />
        </div>
        <span className="at-sep">@</span>
        <div className="domain-wrap">
          <label className="domain-label">Domain</label>
          <select
            className="domain-select"
            value={domain}
            onChange={e => setDomain(e.target.value)}
          >
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="preview">
        Full address: <strong>{local || 'username'}@{domain}</strong>
      </div>

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        error={errors.password}
        required
      />
      <Input
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        error={errors.confirm}
        required
      />

      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </div>
    </form>
  )
}
