'use client'
import { useEffect, useId, useState } from 'react'
import type { Contact } from '@/lib/contacts'

export const useRecipientInput = (value: string) => {
  const id = useId()
  const [contacts, setContacts] = useState<Contact[]>([])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/contacts', { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setContacts(data)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  const split = value.lastIndexOf(',')
  const prefix = split < 0 ? '' : `${value.slice(0, split + 1)} `
  const query = value
    .slice(split + 1)
    .trim()
    .toLowerCase()
  const suggestions = contacts
    .filter((contact) =>
      `${contact.name} ${contact.email} ${contact.group}`
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 8)
    .map((contact) => ({
      value: `${prefix}${contact.email}`,
      label: contact.name || contact.email,
    }))
  if (query) {
    const groups = [
      ...new Set(contacts.map((contact) => contact.group).filter(Boolean)),
    ]
      .filter((group) => group.toLowerCase().includes(query))
      .slice(0, 3)
    for (const group of groups)
      suggestions.push({
        value:
          prefix +
          contacts
            .filter((contact) => contact.group === group)
            .map((contact) => contact.email)
            .join(', '),
        label: `Group: ${group}`,
      })
  }
  return { id, suggestions }
}
