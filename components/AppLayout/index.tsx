'use client'

import Sidebar from '../Sidebar'
import MailList from '../MailList'
import MailViewer from '../MailViewer'
import ComposeModal from '../ComposeModal'
import CommandPalette from '../CommandPalette'
import { useAppLayout } from './useAppLayout'
import './AppLayout.scss'

type Props = {
  userEmail?: string
  isAdmin?: boolean
}

const AppLayout = ({ userEmail, isAdmin }: Props) => {
  const {
    activeFolder,
    selectedThread,
    composeOpen,
    composeState,
    refreshKey,
    sidebarRefreshTrigger,
    mobilePanel,
    setMobilePanel,
    mailListWidth,
    startResize,
    handleCompose,
    handleReply,
    handleFolderChange,
    handleSelect,
    handleDelete,
    swipeRef,
    dragX,
    swipingDir,
    closeCompose,
    setRefreshKey,
    commandsOpen,
    setCommandsOpen,
    commands,
    notice,
    setNotice,
    handleSent,
    refreshCounts,
  } = useAppLayout()

  return (
    <div
      ref={swipeRef}
      className={`AppLayout mobile-${mobilePanel}${swipingDir ? ` swiping-${swipingDir}` : ''}`}
      style={
        {
          '--mail-list-w': `${mailListWidth / 16}em`,
          '--drag-x': `${dragX / 16}em`,
        } as React.CSSProperties
      }
    >
      <Sidebar
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        onCompose={handleCompose}
        userEmail={userEmail}
        isAdmin={isAdmin}
        refreshTrigger={sidebarRefreshTrigger}
        onCommands={() => setCommandsOpen(true)}
      />

      <MailList
        key={activeFolder}
        refreshTrigger={refreshKey}
        folder={activeFolder}
        selectedThread={selectedThread}
        onSelect={handleSelect}
        onMobileBack={() => setMobilePanel('sidebar')}
        onRefresh={refreshCounts}
      />

      <div className="resize-handle" onMouseDown={startResize} />

      <MailViewer
        thread={selectedThread}
        folder={activeFolder}
        onReply={handleReply}
        onDelete={handleDelete}
        onUpdate={() => {
          setRefreshKey((k) => k + 1)
          refreshCounts()
        }}
        onMobileBack={() => setMobilePanel('list')}
      />

      {composeOpen && (
        <ComposeModal
          isOpen={composeOpen}
          userEmail={userEmail || ''}
          onSent={handleSent}
          onClose={closeCompose}
          initialTo={composeState.to}
          initialSubject={composeState.subject}
          initialBody={composeState.body}
          inReplyTo={composeState.inReplyTo}
        />
      )}
      {commandsOpen && (
        <CommandPalette
          commands={commands}
          onClose={() => setCommandsOpen(false)}
        />
      )}
      {notice && (
        <div className="notification" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default AppLayout
