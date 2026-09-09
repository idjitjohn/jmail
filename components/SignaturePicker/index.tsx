'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useSignaturePicker } from './useSignaturePicker'
import './SignaturePicker.scss'

type Props = {
  userEmail: string
  value: string | null
  onChange: (id: string | null, html: string | null) => void
  onManage: () => void
}

const SignaturePicker = ({ value, onChange, onManage, userEmail }: Props) => {
  const { t } = useLocale()

  const { signatures, handleChange } = useSignaturePicker(userEmail, onChange)
  return (
    <div className="SignaturePicker">
      <select
        className="select"
        aria-label={t('Choose signature')}
        value={value ?? ''}
        onChange={handleChange}
      >
        <option value="">{t('Default signature')}</option>
        <option value="__none__">{t('No signature')}</option>
        {signatures.map((signature) => (
          <option key={signature.id} value={signature.id}>
            {signature.name}
          </option>
        ))}
      </select>
      <button
        className="manage-btn"
        onClick={onManage}
        type="button"
        title={t('Manage signatures')}
        aria-label={t('Manage signatures')}
      />
    </div>
  )
}

export default SignaturePicker
