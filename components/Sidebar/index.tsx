'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import LanguageSelector from '../LanguageSelector'
import { useEffect } from 'react'
import Link from 'next/link'
import Button from '../Button'
import FolderItem from '../FolderItem'
import ThemeToggle from '../ThemeToggle'
import Spinner from '../Spinner'
import { useSidebar } from './useSidebar'
import { useLogout } from '@/lib/useLogout'
import type { WorkspaceTab } from '../WorkspacePanel/types'
import './Sidebar.scss'

type Props = {
  onWorkspace?: (tab: WorkspaceTab) => void
  activeFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
  onCommands?: () => void
  userEmail?: string
  isAdmin?: boolean
  // Increment to trigger a folders refetch
  refreshTrigger?: number
}

export default function Sidebar({
  onWorkspace,
  activeFolder,
  onFolderChange,
  onCompose,
  userEmail,
  isAdmin,
  refreshTrigger,
  onCommands,
}: Props) {
  const { t } = useLocale()

  const { folders, loading, error, refetch } = useSidebar()
  const logout = useLogout()

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

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
          {t('New Message')}
        </Button>
      </div>

      <div className="command-wrap">
        <button type="button" className="command-trigger" onClick={onCommands}>
          <span>{t('Quick commands')}</span>
          <kbd>⌘ K</kbd>
        </button>
      </div>
      <p className="section-label">{t('Your workspace')}</p>
      {error && (
        <div className="folder-error" role="alert">
          <p>{t(error)}</p>
          <button type="button" onClick={refetch}>
            {t('Try again')}
          </button>
        </div>
      )}
      <nav className="folders" aria-label={t('Mail folders')}>
        {loading ? (
          <div className="loading">
            <Spinner size="sm" />
          </div>
        ) : (
          folders.map((folder) => (
            <FolderItem
              key={folder.path}
              folder={folder}
              isActive={activeFolder === folder.path}
              onClick={onFolderChange}
            />
          ))
        )}
      </nav>

      <nav
        className="workspace-links"
        aria-label={t('Organize your workspace')}
      >
        <button
          type="button"
          data-icon="person"
          onClick={() => onWorkspace?.('contacts')}
        >
          {t('Contacts')}
        </button>
        <button
          type="button"
          data-icon="clock"
          onClick={() => onWorkspace?.('scheduled')}
        >
          {t('Scheduled')}
        </button>
        <button
          type="button"
          data-icon="clock"
          onClick={() => onWorkspace?.('later')}
        >
          {t('Later & reminders')}
        </button>
        <button
          type="button"
          data-icon="folder-default"
          onClick={() => onWorkspace?.('folders')}
        >
          {t('Manage folders')}
        </button>
      </nav>
      <div className="footer">
        <LanguageSelector />
        {userEmail && (
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
          </div>
        )}
        {isAdmin && (
          <Link href="/admin" className="admin-btn">
            {t('Admin')}
          </Link>
        )}
        <Link href="/settings/profile" className="settings-btn">
          {t('Settings')}
        </Link>
        <button className="logout-btn" onClick={logout} type="button">
          {t('Sign out')}
        </button>
      </div>
    </aside>
  )
}
