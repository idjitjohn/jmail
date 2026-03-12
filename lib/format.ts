// Date/name formatting utilities

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) {
    return date.toLocaleDateString('en', { weekday: 'short' })
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Extract initials from name or email
export function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

// Consistent color from string (for avatars)
export function getAvatarColor(str: string): string {
  const colors = [
    '#007aff', '#34c759', '#ff9500', '#ff3b30',
    '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function formatAddress(addr: { name?: string; address: string }): string {
  if (addr.name) return `${addr.name} <${addr.address}>`
  return addr.address
}
