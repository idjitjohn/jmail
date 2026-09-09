'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import ThemeToggle from '../ThemeToggle'
import './AdminSidebar.scss'

const NAV = [
  { href: '/admin', label: 'Mailboxes', icon: 'accounts' },
  { href: '/admin/mail-server', label: 'Mail server', icon: 'system' },
]

export default function AdminSidebar() {
  const { t } = useLocale()

  const pathname = usePathname()

  return (
    <aside className="AdminSidebar">
      <div className="header">
        <div className="brand">
          <span className="brand-icon" />
          <div className="brand-text">
            <span className="brand-name">JMail</span>
            <span className="brand-sub">{t('Admin')}</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('nav-item', {
              active:
                item.href === '/admin'
                  ? pathname === '/admin' ||
                    pathname.startsWith('/admin/accounts')
                  : pathname.startsWith(item.href),
            })}
            aria-current={
              (
                item.href === '/admin'
                  ? pathname === '/admin' ||
                    pathname.startsWith('/admin/accounts')
                  : pathname.startsWith(item.href)
              )
                ? 'page'
                : undefined
            }
            data-icon={item.icon}
          >
            <span className="nav-icon" />
            <span className="nav-label">{t(item.label)}</span>
          </Link>
        ))}
      </nav>

      <div className="footer">
        <Link href="/inbox" className="back-link">
          {t('Back to Mail')}
        </Link>
      </div>
    </aside>
  )
}
