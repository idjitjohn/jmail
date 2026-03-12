import clsx from 'clsx'
import './Input.scss'

interface Props {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  error?: string
  label?: string
  name?: string
  autoComplete?: string
  autoFocus?: boolean
  className?: string
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled = false,
  required = false,
  error,
  label,
  name,
  autoComplete,
  autoFocus,
  className = '',
}: Props) {
  return (
    <div className={clsx('Input', className)}>
      {label && <label className="label">{label}</label>}
      <input
        type={type}
        className={clsx('field', { error: !!error })}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        required={required}
        name={name}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
      {error && <span className="error-msg">{error}</span>}
    </div>
  )
}
