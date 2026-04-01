'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLogout } from '@/lib/useLogout'
import './SettingsLayout.scss'

interface Props {
  children: React.ReactNode
  userEmail?: string
  isAdmin?: boolean
}

export default function SettingsLayout({ children, userEmail, isAdmin }: Props) {
  const pathname = usePathname()

  const logout = useLogout()

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
          <button className="mobile-signout" onClick={logout} type="button" aria-label="Sign out" />
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
          <button className="logout-btn" onClick={logout} type="button">
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
