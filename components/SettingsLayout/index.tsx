'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '../ThemeToggle'
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

  return (
    <div className="SettingsLayout">
      <aside className="sidebar">
        <div className="header">
          <Link href="/inbox" className="back-link">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
            </svg>
            Back to inbox
          </Link>
          <ThemeToggle />
        </div>

        <div className="nav-title">Settings</div>

        <nav className="nav">
          <Link href="/settings/profile" className={`nav-item ${pathname === '/settings/profile' ? 'active' : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
            </svg>
            Profile
          </Link>
          <Link href="/settings/forwarding" className={`nav-item ${pathname === '/settings/forwarding' ? 'active' : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
            </svg>
            Forwarding
          </Link>
          <Link href="/settings/vacation" className={`nav-item ${pathname === '/settings/vacation' ? 'active' : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
            </svg>
            Vacation reply
          </Link>
        </nav>

        <div className="footer">
          {userEmail && (
            <span className="user-email">{userEmail}</span>
          )}
          <button className="logout-btn" onClick={handleLogout} type="button">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
            </svg>
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
