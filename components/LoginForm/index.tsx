'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import LanguageSelector from '../LanguageSelector'

import Input from '../Input'
import Button from '../Button'
import { useLoginForm } from './useLoginForm'
import './LoginForm.scss'

export default function LoginForm() {
  const { t } = useLocale()

  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  } = useLoginForm()

  return (
    <div className="LoginForm">
      <div className="card">
        <div className="logo">
          <span className="logo-icon" />
          <span className="logo-name">JMail</span>
        </div>

        <LanguageSelector />
        <h1 className="title">{t('Sign in')}</h1>
        <p className="subtitle">
          {t('Enter your mail credentials to continue')}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <Input
            label={t('Email address')}
            type="email"
            placeholder={t('you@example.com')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
          <Input
            label={t('Password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="form-error">{t(error)}</p>}

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="submit-btn"
          >
            {t('Sign in')}
          </Button>
        </form>
      </div>
    </div>
  )
}
