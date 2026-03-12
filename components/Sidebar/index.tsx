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
  // Increment to trigger a folders refetch
  refreshTrigger?: number
}

export default function Sidebar({ activeFolder, onFolderChange, onCompose, userEmail, refreshTrigger }: Props) {
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
          <svg className="brand-icon" viewBox="0 0 155 155" fill="currentColor">
            <path d="m 2.5517202,17.099237 c -0.12348,-4.04294 1.49577,-8.0815976 4.78007,-10.9243864 3.3079188,-2.86324 7.5737588,-3.87739 10.7949788,-3.625415 0.79007,-0.14241 120.646091,0.281975 120.646091,0.281975 7.50792,0.002 13.58592,6.0474388 13.6281,13.5552464 0.0422,7.5078 -5.96825,13.55094 -13.47618,13.54904 l -92.611391,-0.0238 32.19442,37.194631 c 4.27223,4.93574 4.56655,11.89147 2.12076,15.48624 -0.42986,0.7225 -26.41023,31.280912 -26.41023,31.280912 L 17.014919,114.25764 49.732309,76.459438 6.0388502,25.979837 c -2.24116,-2.58923 -3.39109,-5.73608 -3.48713,-8.8806 z" />
            <path d="m 115.48237,49.235298 c -7.52431,-0.005 -13.56973,6.04798 -13.55473,13.57229 0.015,7.5243 6.08469,13.58642 13.60899,13.59142 l 2.08721,0.0021 8.53746,0.0062 -0.006,16.88527 h -0.004 l -0.0114,31.778932 -111.11517,-0.0439 c -7.5243078,-0.005 -13.5697278,6.04799 -13.5547278,13.5723 0.015,7.52428 6.08469,13.58642 13.6089878,13.59142 l 124.43426,-0.0119 c 9.20697,0.002 13.74646,-7.94972 13.74903,-15.11122 l 0.0119,-34.63045 h 0.004 l 0.0134,-39.388282 c 10e-4,-0.0681 0.005,-0.13531 0.005,-0.20361 -0.015,-7.52427 -6.0847,-13.58641 -13.60899,-13.59141 l -22.06377,-0.01706 z" />
          </svg>
          <span className="brand-name">JMail</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="compose-wrap">
        <Button onClick={onCompose} className="compose-btn">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
          </svg>
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
        <Link href="/settings/forwarding" className="settings-btn">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
          </svg>
          Settings
        </Link>
        <button className="logout-btn" onClick={handleLogout} type="button">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
