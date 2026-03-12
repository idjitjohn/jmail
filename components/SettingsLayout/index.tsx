'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './SettingsLayout.scss'

interface Props {
  children: React.ReactNode
  userEmail?: string
  isAdmin?: boolean
}

export default function SettingsLayout({ children, userEmail, isAdmin }: Props) {
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
          {/* Mobile-only sign out */}
          <button className="mobile-signout" onClick={handleLogout} type="button" aria-label="Sign out">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
            </svg>
          </button>
        </div>

        <nav className="nav">
          {navItem('/settings/profile', 'Profile', 'person')}
          {navItem('/settings/appearance', 'Appearance', 'appearance')}
          {navItem('/settings/filters', 'Filters', 'filter')}
          {navItem('/settings/advanced', 'Advanced', 'gear')}
          {isAdmin && navItem('/admin', 'Admin', 'dashboard')}
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
