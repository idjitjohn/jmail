'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../LocaleProvider/useLocale'
import { formatAddress } from '@/lib/format'
import type { MailMessage } from '@/lib/types'
import type { MailAction } from '../MailActionMenu/types'

export const useMailViewerMessage = (
  message: MailMessage,
  full?: MailMessage,
  expanded = false,
) => {
  const { t, plural, formatDate, formatFullDate, formatBytes, dateTime } =
    useLocale()
  const contentId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const recipientsRef = useRef<HTMLDetailsElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const details = full || message
  const recipients = details.to.map(
    (address) => address.name || address.address,
  )
  const recipientsLabel = recipients.slice(0, 2).join(', ')
  const recipientGroups = [
    { label: 'From:', addresses: [details.from] },
    { label: 'To:', addresses: details.to },
    { label: 'Cc:', addresses: details.cc || [] },
    { label: 'Bcc:', addresses: details.bcc || [] },
  ].filter((group) => group.addresses.length)
  const attachments = (full?.attachments || []).map((attachment) => ({
    ...attachment,
    downloadUrl: `/api/messages/${message.uid}/attachments/${attachment.partId}?folder=${encodeURIComponent(message.folder)}`,
    sizeLabel: formatBytes(attachment.size),
    kind:
      attachment.contentType === 'application/pdf'
        ? 'pdf'
        : attachment.contentType.startsWith('image/')
          ? 'image'
          : 'file',
    extension:
      attachment.filename.split('.').pop()?.slice(0, 5).toUpperCase() ||
      t('File'),
  }))
  const utilities: MailAction[] = [
    {
      id: 'export',
      label: 'Export .eml',
      icon: 'download',
      href: `/api/messages/${message.uid}/source?folder=${encodeURIComponent(message.folder)}`,
      download: true,
    },
    {
      id: 'print',
      label: 'Print',
      icon: 'print',
      onClick: () => window.print(),
    },
  ]

  useEffect(() => {
    let previouslyOpen = false
    const prepare = () => {
      const recipients = recipientsRef.current
      if (!recipients) return
      previouslyOpen = recipients.open
      recipients.open = true
    }
    const restore = () => {
      if (recipientsRef.current) recipientsRef.current.open = previouslyOpen
    }
    window.addEventListener('beforeprint', prepare)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', prepare)
      window.removeEventListener('afterprint', restore)
    }
  }, [])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const update = () =>
      setOverflowing(content.scrollWidth > content.clientWidth + 1)
    const observer = new ResizeObserver(update)
    observer.observe(content)
    if (content.firstElementChild) observer.observe(content.firstElementChild)
    content.addEventListener('load', update, true)
    update()
    return () => {
      observer.disconnect()
      content.removeEventListener('load', update, true)
    }
  }, [full, expanded])

  return {
    t,
    plural,
    contentId,
    contentRef,
    recipientsRef,
    overflowing,
    details,
    dateLabel: expanded
      ? dateTime(message.date, { day: 'numeric', month: 'short' })
      : formatDate(message.date),
    timeLabel: dateTime(message.date, { hour: 'numeric', minute: '2-digit' }),
    fullDateLabel: formatFullDate(message.date),
    recipientsLabel,
    remainingRecipients: Math.max(0, recipients.length - 2),
    recipientGroups: recipientGroups.map((group) => ({
      ...group,
      value: group.addresses.map(formatAddress).join(', '),
    })),
    attachments,
    utilities,
    originalColors: Boolean(
      full?.html &&
      /(?:\b(?:color|background(?:-color)?)\s*:|\bbgcolor\s*=)/i.test(
        full.html,
      ),
    ),
    showReplyAll:
      !details.isDraft &&
      new Set(
        [...details.to, ...(details.cc || [])].map((address) =>
          address.address.toLowerCase(),
        ),
      ).size > 1,
  }
}
