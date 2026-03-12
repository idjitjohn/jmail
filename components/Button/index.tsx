import Spinner from '../Spinner'
import './Button.scss'

interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  title?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  title,
}: Props) {
  return (
    <button
      type={type}
      className={`Button ${variant} ${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}
