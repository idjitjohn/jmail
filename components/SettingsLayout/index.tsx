'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './SettingsLayout.scss'

interface Props {
  children: React.ReactNode
  userEmail?: string
}

export default function SettingsLayout({ children, userEmail }: Props) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const navItem = (href: string, label: string, icon: string) => (
    <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} data-icon={icon}>
      <span className="nav-icon" />
      {label}
    </Link>
  )

  return (
    <div className="SettingsLayout">
      <aside className="sidebar">
        <div className="header">
          <Link href="/inbox" className="back-link">
            Back
          </Link>
        </div>

        <nav className="nav">
          {navItem('/settings/profile', 'Profile', 'person')}
          {navItem('/settings/appearance', 'Appearance', 'appearance')}
          {navItem('/settings/advanced', 'Advanced', 'gear')}
        </nav>

        <div className="footer">
          {userEmail && <span className="user-email">{userEmail}</span>}
          <button className="logout-btn" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  )
}
