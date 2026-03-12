'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import ThemeToggle from '../ThemeToggle'
import './AdminSidebar.scss'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/accounts', label: 'Accounts', icon: 'accounts' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="AdminSidebar">
      <div className="header">
        <div className="brand">
          <span className="brand-icon" />
          <div className="brand-text">
            <span className="brand-name">JMail</span>
            <span className="brand-sub">Admin</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="nav">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('nav-item', {
              active: item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href),
            })}
            data-icon={item.icon}
          >
            <span className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="footer">
        <Link href="/inbox" className="back-link">
          Back to Mail
        </Link>
      </div>
    </aside>
  )
}
