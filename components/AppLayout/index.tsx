'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Sidebar from '../Sidebar'
import WorkspacePanel from '../WorkspacePanel'
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
  const { t } = useLocale()

  const {
    workspace,
    setWorkspace,
    closeWorkspace,
    writeToContact,
    preferences,
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
      data-density={preferences.density}
      data-previews={preferences.showPreviews}
      data-reading-size={preferences.readingSize}
      data-shortcuts={preferences.keyboardShortcuts}
      className={`AppLayout mobile-${mobilePanel}${swipingDir ? ` swiping-${swipingDir}` : ''}`}
      style={
        {
          '--mail-list-w': `${mailListWidth / 16}em`,
          '--drag-x': `${dragX / 16}em`,
        } as React.CSSProperties
      }
    >
      <Sidebar
        onWorkspace={setWorkspace}
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
        userEmail={userEmail}
        thread={selectedThread}
        folder={selectedThread?.latest.folder || activeFolder}
        onReply={handleReply}
        onDelete={handleDelete}
        onUpdate={() => {
          setRefreshKey((k) => k + 1)
          refreshCounts()
        }}
        onMobileBack={() => setMobilePanel('list')}
      />

      {workspace && (
        <WorkspacePanel
          initialTab={workspace}
          onClose={closeWorkspace}
          onCompose={writeToContact}
        />
      )}
      {composeOpen && (
        <ComposeModal
          isOpen={composeOpen}
          userEmail={userEmail || ''}
          onSent={handleSent}
          onClose={closeCompose}
          initialCc={composeState.cc}
          initialBcc={composeState.bcc}
          initialAttachments={composeState.attachments}
          draftUid={composeState.draftUid}
          references={composeState.references}
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
          <span>{t(notice)}</span>
          <button
            type="button"
            aria-label={t('Dismiss notification')}
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
