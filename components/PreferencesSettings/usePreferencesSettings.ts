'use client'

import { useState } from 'react'
import { usePreferences } from '../PreferencesProvider/usePreferences'
import type { MailPreferences } from '@/lib/preferences'

export const usePreferencesSettings = () => {
  const [notificationError, setNotificationError] = useState('')
  const { preferences, saving, update } = usePreferences()
  return {
    notificationError,
    setNotifications: async (enabled: boolean) => {
      setNotificationError('')
      if (enabled) {
        if (!('Notification' in window)) {
          setNotificationError(
            'This browser does not support desktop notifications.',
          )
          return
        }
        try {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            setNotificationError(
              'Allow notifications in your browser’s site settings, then try again.',
            )
            return
          }
        } catch {
          setNotificationError(
            'Notifications are not available in this browser.',
          )
          return
        }
      }
      await update({ desktopNotifications: enabled })
    },
    preferences,
    saving,
    setUndoDelay: (value: string) =>
      update({
        undoSendSeconds: Number(value) as MailPreferences['undoSendSeconds'],
      }),
    setAttachmentReminder: (value: boolean) =>
      update({ attachmentReminder: value }),
    setMarkRead: (value: boolean) => update({ markReadOnOpen: value }),
    setShortcuts: (value: boolean) => update({ keyboardShortcuts: value }),
    setSwipe: (value: boolean) => update({ swipeToDelete: value }),
  }
}
