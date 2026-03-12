'use client'

import { useState } from 'react'
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

export default function AppLayout({ userEmail }: Props) {
  const [activeFolder, setActiveFolder] = useState('INBOX')
  const [selectedUid, setSelectedUid] = useState<number | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeState, setComposeState] = useState<ComposeState>({ to: '', subject: '' })
  const [refreshKey, setRefreshKey] = useState(0)

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
  }

  const handleDelete = () => {
    setSelectedUid(null)
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="AppLayout">
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
        onSelect={setSelectedUid}
      />

      <MailViewer
        uid={selectedUid}
        folder={activeFolder}
        onReply={handleReply}
        onDelete={handleDelete}
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
