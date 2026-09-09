'use client'

import { useRef, useState } from 'react'
import { readApiResponse } from './api-client'

export const useLogout = () => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const locked = useRef(false)
  const logout = async () => {
    if (locked.current) return
    locked.current = true
    setLoading(true)
    setError('')
    try {
      await readApiResponse(
        await fetch('/api/auth/logout', { method: 'POST' }),
        'Could not sign out. Please try again.',
      )
      window.location.assign('/')
    } catch {
      setError('Could not sign out. Please try again.')
      locked.current = false
      setLoading(false)
    }
  }
  return { logout, error, loading }
}
