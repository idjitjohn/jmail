'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import './PreferenceToggle.scss'

type Props = {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

const PreferenceToggle = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: Props) => {
  const { t } = useLocale()
  return (
    <label className="PreferenceToggle">
      <span className="copy">
        <strong>{t(label)}</strong>
        <span>{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={t(label)}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export default PreferenceToggle
