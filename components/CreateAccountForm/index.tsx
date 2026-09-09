'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Input from '../Input'
import Button from '../Button'
import { useCreateAccountForm } from './useCreateAccountForm'
import './CreateAccountForm.scss'

type Props = { domains: string[] }

const CreateAccountForm = ({ domains }: Props) => {
  const { t } = useLocale()

  const {
    local,
    setLocal,
    domain,
    setDomain,
    password,
    setPassword,
    confirm,
    setConfirm,
    loading,
    errors,
    handleSubmit,
    back,
  } = useCreateAccountForm(domains)

  return (
    <form className="CreateAccountForm" onSubmit={handleSubmit}>
      {!domains.length && (
        <p role="alert">
          {t(
            'No domains available. Connect Maddy administration and add a domain in Mail server first.',
          )}
        </p>
      )}
      <div className="email-row">
        <div className="local-wrap">
          <Input
            label={t('Local part')}
            placeholder={t('username')}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            error={errors.local}
            autoComplete="off"
            autoFocus
            required
          />
        </div>
        <span className="at-sep">@</span>
        <div className="domain-wrap">
          <label className="domain-label">{t('Domain')}</label>
          <select
            className="domain-select"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="preview">
        {t('Full address:')}{' '}
        <strong>
          {local || t('username')}@{domain}
        </strong>
      </div>

      <Input
        label={t('Password')}
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
        autoComplete="new-password"
      />
      <Input
        label={t('Confirm password')}
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
        required
      />

      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={back}>
          {t('Cancel')}
        </Button>
        <Button type="submit" loading={loading} disabled={!domains.length}>
          {t('Create account')}
        </Button>
      </div>
    </form>
  )
}

export default CreateAccountForm
