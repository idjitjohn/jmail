'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Contact } from '@/lib/contacts'
import type { MailFolder } from '@/lib/types'
import type { LaterItem, ScheduledItem, WorkspaceTab } from './types'
import { toLocalDateTime } from '@/lib/compose-utils'

const emptyContact: Contact = {
  id: '',
  name: '',
  email: '',
  company: '',
  phone: '',
  group: '',
}
const request = async <T>(
  url: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(url, {
    method,
    signal,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.error || 'Could not complete this action.')
  return data
}
export const useWorkspacePanel = (
  initialTab: WorkspaceTab,
  onCompose: (to: string) => void,
  onClose: () => void,
) => {
  const [tab, setTab] = useState(initialTab)
  const [later, setLater] = useState<LaterItem[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [contact, setContact] = useState<Contact | null>(null)
  const [folderName, setFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState('')
  const [scheduleEdit, setScheduleEdit] = useState<ScheduledItem | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    run: () => Promise<void>
  } | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (tab === 'contacts') {
        const data = await request<Contact[]>(
          '/api/contacts',
          'GET',
          undefined,
          signal,
        )
        if (!signal?.aborted) setContacts(data)
      } else if (tab === 'folders') {
        const data = await request<MailFolder[]>(
          '/api/folders',
          'GET',
          undefined,
          signal,
        )
        if (!signal?.aborted) setFolders(data)
      } else if (tab === 'scheduled') {
        const data = await request<{ messages: ScheduledItem[] }>(
          '/api/messages/schedule',
          'GET',
          undefined,
          signal,
        )
        if (!signal?.aborted) setScheduled(data.messages)
      } else {
        const data = await request<LaterItem[]>(
          '/api/messages/later',
          'GET',
          undefined,
          signal,
        )
        if (!signal?.aborted) setLater(data)
      }
    },
    [tab],
  )
  useEffect(() => {
    const controller = new AbortController()
    const start = async () => {
      setLoading(true)
      setError('')
      try {
        await load(controller.signal)
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : 'Please try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void start()
    return () => controller.abort()
  }, [load])
  const run = async (action: () => Promise<void>, message: string) => {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(message)
      setConfirm(null)
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }
  const saveContact = (event: React.FormEvent) => {
    event.preventDefault()
    if (!contact) return
    void run(async () => {
      await request('/api/contacts', contact.id ? 'PATCH' : 'POST', contact)
      setContact(null)
    }, 'Contact saved.')
  }
  const saveFolder = (event: React.FormEvent) => {
    event.preventDefault()
    void run(async () => {
      await request('/api/folders', editingFolder ? 'PATCH' : 'POST', {
        name: editingFolder || folderName,
        newName: folderName,
      })
      setFolderName('')
      setEditingFolder('')
    }, 'Folder saved.')
  }
  const saveSchedule = (event: React.FormEvent) => {
    event.preventDefault()
    if (!scheduleEdit) return
    void run(async () => {
      await request('/api/messages/schedule', 'PATCH', {
        id: scheduleEdit.id,
        sendAt: new Date(scheduleEdit.sendAt).toISOString(),
      })
      setScheduleEdit(null)
    }, 'Sending time updated.')
  }
  const exportContacts = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(contacts, null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'contacts.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const importContacts = (file?: File) => {
    if (!file) return
    void run(async () => {
      if (file.size > 2 * 1024 * 1024)
        throw new Error('Choose a contacts JSON file smaller than 2 MB.')
      await request('/api/contacts', 'POST', JSON.parse(await file.text()))
      if (uploadRef.current) uploadRef.current.value = ''
    }, 'Contacts imported. Duplicate email addresses were skipped.')
  }
  return {
    requestClose: () => {
      if (contact || folderName || scheduleEdit)
        setConfirm({
          title: 'Close without saving these changes?',
          run: async () => onClose(),
        })
      else onClose()
    },
    later,
    updateLater: (item: LaterItem, action: string) =>
      run(
        async () => {
          await request('/api/messages/later', 'PATCH', { id: item.id, action })
        },
        action === 'restore'
          ? 'This message will return after the next scheduled check.'
          : 'Reminder removed.',
      ),
    tab,
    setTab,
    loading,
    busy,
    error,
    notice,
    query,
    setQuery,
    contact,
    setContact,
    folders,
    scheduled,
    folderName,
    setFolderName,
    editingFolder,
    setEditingFolder,
    scheduleEdit,
    setScheduleEdit,
    confirm,
    setConfirm,
    uploadRef,
    contacts: contacts
      .filter((contact) =>
        `${contact.name} ${contact.email} ${contact.company} ${contact.group}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)),
    addContact: () => setContact({ ...emptyContact }),
    saveContact,
    saveFolder,
    saveSchedule,
    exportContacts,
    importContacts,
    writeTo: (email: string) => onCompose(email),
    deleteContact: (item: Contact) =>
      setConfirm({
        title: `Remove ${item.name || item.email} from contacts?`,
        run: () =>
          run(async () => {
            await request('/api/contacts', 'DELETE', { id: item.id })
          }, 'Contact removed.'),
      }),
    deleteFolder: (item: MailFolder) =>
      setConfirm({
        title: `Delete “${item.name}”? Only empty folders can be deleted.`,
        run: () =>
          run(async () => {
            await request('/api/folders', 'DELETE', { name: item.path })
          }, 'Folder removed.'),
      }),
    cancelSchedule: (item: ScheduledItem) =>
      setConfirm({
        title: `Cancel “${item.subject}”? This scheduled message will be removed and will not be sent.`,
        run: () =>
          run(async () => {
            await request('/api/messages/schedule', 'DELETE', { id: item.id })
          }, 'Scheduled message cancelled.'),
      }),
    editSchedule: (item: ScheduledItem) =>
      setScheduleEdit({
        ...item,
        sendAt: toLocalDateTime(new Date(item.sendAt)),
      }),
    minSchedule: toLocalDateTime(new Date()),
    protectedFolder: (folder: MailFolder) =>
      Boolean(
        folder.specialUse ||
        /^(inbox|sent|drafts|trash|spam|junk|archive)$/i.test(folder.path),
      ),
  }
}
