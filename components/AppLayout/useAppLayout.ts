'use client'

import { useLocale } from '../LocaleProvider/useLocale'
import { useState, useCallback, useEffect, useRef } from 'react'
import { usePreferences } from '../PreferencesProvider/usePreferences'
import { useRouter } from 'next/navigation'
import { useRealtimeSync } from '../useRealtimeSync'
import { useSwipe } from '@/lib/useSwipe'
import type { WorkspaceTab } from '../WorkspacePanel/types'
import type { MailThread } from '@/lib/types'
import type { Command } from '../CommandPalette/types'
import type { ComposeState, MobilePanel } from './types'

export const useAppLayout = () => {
  const { t } = useLocale()
  const { preferences } = usePreferences()
  const [workspace, setWorkspace] = useState<WorkspaceTab | null>(null)
  const [activeFolder, setActiveFolder] = useState('INBOX')
  const [commandsOpen, setCommandsOpen] = useState(false)
  const composeOrigin = useRef<HTMLElement | null>(null)
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeState, setComposeState] = useState<ComposeState>({
    to: '',
    subject: '',
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list')
  const [mailListWidth, setMailListWidth] = useState(368)

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem('mailListWidth'))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser preference hydration
      if (stored) setMailListWidth(Math.max(280, Math.min(600, stored)))
    } catch {
      /* Unavailable storage */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('mailListWidth', String(mailListWidth))
    } catch {
      /* Unavailable storage */
    }
  }, [mailListWidth])

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = mailListWidth
      const onMove = (ev: MouseEvent) =>
        setMailListWidth(
          Math.max(280, Math.min(600, startW + ev.clientX - startX)),
        )
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
    },
    [mailListWidth],
  )

  const handleCompose = () => {
    composeOrigin.current = document.activeElement as HTMLElement | null
    setNotice('')
    setComposeState({ to: '', subject: '' })
    setComposeOpen(true)
  }

  const handleReply = (data: ComposeState) => {
    composeOrigin.current = document.activeElement as HTMLElement | null
    setNotice('')
    setComposeState(data)
    setComposeOpen(true)
  }

  const closeCompose = useCallback(() => {
    setComposeOpen(false)
    requestAnimationFrame(() => {
      if (composeOrigin.current?.isConnected) composeOrigin.current.focus()
    })
  }, [])

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
      if (
        preferences.desktopNotifications &&
        document.hidden &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const notification = new Notification(t('New mail in JMail'), {
            body: t('Your inbox has new mail.'),
            tag: 'jmail-new-mail',
          })
          notification.onclick = () => {
            window.focus()
            notification.close()
          }
        } catch {
          /* Browser notification availability */
        }
      }
      if (folder === activeFolder) setRefreshKey((k) => k + 1)
      setSidebarRefreshTrigger((k) => k + 1)
    },
    onFlagUpdate: () => {
      setRefreshKey((k) => k + 1)
      setSidebarRefreshTrigger((k) => k + 1)
    },
    onMailExpunged: (folder) => {
      if (folder === activeFolder) setRefreshKey((k) => k + 1)
      setSidebarRefreshTrigger((k) => k + 1)
    },
  })

  const handleDelete = () => {
    setSelectedThread(null)
    setRefreshKey((k) => k + 1)
    setSidebarRefreshTrigger((k) => k + 1)
    setMobilePanel('list')
  }

  // Panel navigation swipe — only active on mobile (hook is cheap when not triggered)
  const {
    ref: swipeRef,
    dragX,
    dragging,
  } = useSwipe<HTMLDivElement>({
    disabled: composeOpen || commandsOpen,
    ignoreSelector:
      '.MailItem, input, textarea, select, [contenteditable="true"], [aria-modal="true"]',
    onSwipeRight: () => {
      if (mobilePanel === 'list') setMobilePanel('sidebar')
      else if (mobilePanel === 'message') setMobilePanel('list')
    },
    onSwipeLeft: () => {
      if (mobilePanel === 'sidebar') setMobilePanel('list')
      else if (mobilePanel === 'list' && selectedThread)
        setMobilePanel('message')
    },
  })

  const swipingDir =
    dragging && dragX !== 0 ? (dragX > 0 ? 'right' : 'left') : null

  const [notice, setNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timeout)
  }, [notice])

  const focusSearch = () => {
    setMobilePanel('list')
    requestAnimationFrame(() => window.dispatchEvent(new Event('jmail:search')))
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        composeOpen ||
        document.querySelector('[aria-modal="true"]')
      )
        return
      const target = event.target as HTMLElement
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandsOpen(true)
        return
      }
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      if (event.key === 'Escape') {
        setSelectedThread(null)
        setMobilePanel('list')
        return
      }
      if (
        !preferences.keyboardShortcuts ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return
      if (event.key === '?') {
        event.preventDefault()
        setCommandsOpen(true)
      }
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        handleCompose()
      }
      if (event.key === '/') setMobilePanel('list')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const commands: Command[] = [
    {
      id: 'compose',
      label: 'Write a message',
      description: 'Start a new conversation',
      icon: 'compose',
      shortcut: preferences.keyboardShortcuts ? 'C' : undefined,
      run: handleCompose,
    },
    {
      id: 'search',
      label: 'Search messages',
      description: 'Find a person, subject, or phrase',
      icon: 'find',
      shortcut: preferences.keyboardShortcuts ? '/' : undefined,
      run: focusSearch,
    },
    {
      id: 'inbox',
      label: 'Go to inbox',
      description: 'Back to what’s new',
      icon: 'inbox',
      run: () => handleFolderChange('INBOX'),
    },
    {
      id: 'settings',
      label: 'Open settings',
      description: 'Make JMail feel like you',
      icon: 'settings',
      run: () => router.push('/settings/profile'),
    },
  ]

  const handleSent = (message: string) => {
    setNotice(message)
    setSidebarRefreshTrigger((k) => k + 1)
    setRefreshKey((k) => k + 1)
  }

  return {
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
    workspace,
    setWorkspace,
    closeWorkspace: () => {
      setWorkspace(null)
      setSidebarRefreshTrigger((k) => k + 1)
      setRefreshKey((k) => k + 1)
    },
    writeToContact: (to: string) => {
      setWorkspace(null)
      handleReply({ to, subject: '' })
    },
    notice,
    setNotice,
    handleSent,
    refreshCounts: () => setSidebarRefreshTrigger((k) => k + 1),
  }
}
