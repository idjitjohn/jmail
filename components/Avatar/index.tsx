import { getInitials, getAvatarColor } from '@/lib/format'
import './Avatar.scss'

interface Props {
  name?: string
  email?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ name, email, size = 'md' }: Props) {
  const initials = getInitials(name, email)
  const color = getAvatarColor(name || email || '?')

  return (
    <span
      className={`Avatar ${size}`}
      style={{ backgroundColor: color }}
      aria-label={name || email}
    >
      <span className="initials">{initials}</span>
    </span>
  )
}
