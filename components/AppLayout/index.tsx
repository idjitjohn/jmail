'use client'

import { useState, useCallback, useEffect } from 'react'
import Sidebar from '../Sidebar'
import MailList from '../MailList'
import MailViewer from '../MailViewer'
import ComposeModal from '../ComposeModal'
import { useRealtimeSync } from '../useRealtimeSync'
import { useSwipe } from '@/lib/useSwipe'
import type { MailThread } from '@/lib/types'
import './AppLayout.scss'

interface Props {
  userEmail?: string
  isAdmin?: boolean
}

interface ComposeState {
  to: string
  subject: string
  body?: string
  inReplyTo?: string
}

type MobilePanel = 'sidebar' | 'list' | 'message'

export default function AppLayout({ userEmail, isAdmin }: Props) {
  const [activeFolder, setActiveFolder] = useState('INBOX')
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeState, setComposeState] = useState<ComposeState>({ to: '', subject: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('sidebar')
  const [mailListWidth, setMailListWidth] = useState(() => {
    if (typeof window === 'undefined') return 352
    return parseInt(localStorage.getItem('mailListWidth') || '352', 10)
  })

  useEffect(() => {
    localStorage.setItem('mailListWidth', String(mailListWidth))
  }, [mailListWidth])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = mailListWidth
    const onMove = (ev: MouseEvent) =>
      setMailListWidth(Math.max(180, Math.min(600, startW + ev.clientX - startX)))
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [mailListWidth])

  const handleCompose = () => {
    setComposeState({ to: '', subject: '' })
    setComposeOpen(true)
  }

  const handleReply = (data: ComposeState) => {
    setComposeState(data)
    setComposeOpen(true)
  }

  const handleFolderChange = (folder: string) => {
    setActiveFolder(folder)
    setSelectedThread(null)
    setMobilePanel('list')
  }

  const handleSelect = (thread: MailThread) => {
    setSelectedThread(thread)
    setMobilePanel('message')
  }

  useRealtimeSync({
    onNewMail: (folder) => {
      if (folder === activeFolder) setRefreshKey(k => k + 1)
      setSidebarRefreshTrigger(k => k + 1)
    },
    onFlagUpdate: () => {
      setSidebarRefreshTrigger(k => k + 1)
    },
    onMailExpunged: (folder) => {
      if (folder === activeFolder) setRefreshKey(k => k + 1)
      setSidebarRefreshTrigger(k => k + 1)
    },
  })

  const handleDelete = () => {
    setSelectedThread(null)
    setRefreshKey(k => k + 1)
    setMobilePanel('list')
  }

  // Panel navigation swipe — only active on mobile (hook is cheap when not triggered)
  const { ref: swipeRef, dragX, dragging } = useSwipe<HTMLDivElement>({
    onSwipeRight: () => {
      if (mobilePanel === 'list') setMobilePanel('sidebar')
      else if (mobilePanel === 'message') setMobilePanel('list')
    },
    onSwipeLeft: () => {
      if (mobilePanel === 'sidebar') setMobilePanel('list')
      else if (mobilePanel === 'list' && selectedThread) setMobilePanel('message')
    },
  })

  const swipingDir = dragging && dragX !== 0
    ? (dragX > 0 ? 'right' : 'left')
    : null

  return (
    <div
      ref={swipeRef}
      className={`AppLayout mobile-${mobilePanel}${swipingDir ? ` swiping-${swipingDir}` : ''}`}
      style={{
        '--mail-list-w': `${mailListWidth}px`,
        '--drag-x': `${dragX}px`,
      } as React.CSSProperties}
    >
      <Sidebar
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        onCompose={handleCompose}
        userEmail={userEmail}
        isAdmin={isAdmin}
        refreshTrigger={sidebarRefreshTrigger}
      />

      <MailList
        key={`${activeFolder}-${refreshKey}`}
        folder={activeFolder}
        selectedThread={selectedThread}
        onSelect={handleSelect}
        onMobileBack={() => setMobilePanel('sidebar')}
        onRefresh={() => setRefreshKey(k => k + 1)}
      />

      <div className="resize-handle" onMouseDown={startResize} />

      <MailViewer
        thread={selectedThread}
        folder={activeFolder}
        onReply={handleReply}
        onDelete={handleDelete}
        onMobileBack={() => setMobilePanel('list')}
      />

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        initialTo={composeState.to}
        initialSubject={composeState.subject}
        initialBody={composeState.body}
        inReplyTo={composeState.inReplyTo}
      />
    </div>
  )
}
