'use client'

import Input from '../Input'
import Button from '../Button'
import { useLoginForm } from './useLoginForm'
import './LoginForm.scss'

export default function LoginForm() {
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } = useLoginForm()

  return (
    <div className="LoginForm">
      <div className="card">
      <div className="logo">
        <span className="logo-icon" />
        <span className="logo-name">JMail</span>
      </div>

      <h1 className="title">Sign in</h1>
      <p className="subtitle">Enter your mail credentials to continue</p>

      <form className="form" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="form-error">{error}</p>}

        <Button type="submit" loading={loading} size="lg" className="submit-btn">
          Sign in
        </Button>
      </form>
      </div>
    </div>
  )
}
