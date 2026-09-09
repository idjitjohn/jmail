'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import clsx from 'clsx'
import './Textarea.scss'

interface Props {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  error?: string
  label?: string
  name?: string
  rows?: number
  className?: string
}

export default function Textarea({
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  name,
  rows = 6,
  className = '',
}: Props) {
  const { t } = useLocale()

  return (
    <div className={clsx('Textarea', className)}>
      {label && <label className="label">{t(label)}</label>}
      <textarea
        className={clsx('field', { error: !!error })}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        rows={rows}
      />
      {error && <span className="error-msg">{t(error)}</span>}
    </div>
  )
}
