'use client'

import { useState, useCallback } from 'react'
import Sidebar from '../Sidebar'
import MailList from '../MailList'
import MailViewer from '../MailViewer'
import ComposeModal from '../ComposeModal'
import './AppLayout.scss'

interface Props {
  userEmail?: string
}

interface ComposeState {
  to: string
  subject: string
  body?: string
  inReplyTo?: string
}

type MobilePanel = 'sidebar' | 'list' | 'message'

export default function AppLayout({ userEmail }: Props) {
  const [activeFolder, setActiveFolder] = useState('INBOX')
  const [selectedUid, setSelectedUid] = useState<number | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeState, setComposeState] = useState<ComposeState>({ to: '', subject: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('sidebar')
  const [mailListWidth, setMailListWidth] = useState(352) // 22em default

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
    setSelectedUid(null)
    setMobilePanel('list')
  }

  const handleSelect = (uid: number) => {
    setSelectedUid(uid)
    setMobilePanel('message')
  }

  const handleDelete = () => {
    setSelectedUid(null)
    setRefreshKey(k => k + 1)
    setMobilePanel('list')
  }

  return (
    <div
      className={`AppLayout mobile-${mobilePanel}`}
      style={{ '--mail-list-w': `${mailListWidth}px` } as React.CSSProperties}
    >
      <Sidebar
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        onCompose={handleCompose}
        userEmail={userEmail}
      />

      <MailList
        key={`${activeFolder}-${refreshKey}`}
        folder={activeFolder}
        selectedUid={selectedUid}
        onSelect={handleSelect}
        onMobileBack={() => setMobilePanel('sidebar')}
      />

      <div className="resize-handle" onMouseDown={startResize} />

      <MailViewer
        uid={selectedUid}
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
