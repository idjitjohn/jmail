'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '../Button'
import FolderItem from '../FolderItem'
import ThemeToggle from '../ThemeToggle'
import Spinner from '../Spinner'
import { useSidebar } from './useSidebar'
import './Sidebar.scss'

interface Props {
  activeFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
  userEmail?: string
  isAdmin?: boolean
  // Increment to trigger a folders refetch
  refreshTrigger?: number
}

export default function Sidebar({ activeFolder, onFolderChange, onCompose, userEmail, isAdmin, refreshTrigger }: Props) {
  const { folders, loading, refetch } = useSidebar()

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <aside className="Sidebar">
      <div className="header">
        <div className="brand">
          <span className="brand-icon" />
          <span className="brand-name">JMail</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="compose-wrap">
        <Button onClick={onCompose} className="compose-btn">
          New Message
        </Button>
      </div>

      <nav className="folders">
        {loading ? (
          <div className="loading">
            <Spinner size="sm" />
          </div>
        ) : (
          folders.map(folder => (
            <FolderItem
              key={folder.path}
              folder={folder}
              isActive={activeFolder === folder.path}
              onClick={onFolderChange}
            />
          ))
        )}
      </nav>

      <div className="footer">
        {userEmail && (
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
          </div>
        )}
        {isAdmin && (
          <Link href="/admin" className="admin-btn">
            Admin
          </Link>
        )}
        <Link href="/settings/profile" className="settings-btn">
          Settings
        </Link>
        <button className="logout-btn" onClick={handleLogout} type="button">
          Sign out
        </button>
      </div>
    </aside>
  )
}
