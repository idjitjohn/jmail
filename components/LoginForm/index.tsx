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
        <svg className="logo-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
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
