import type { MailMessage } from './types'

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  )

export const replyContext = (
  message: MailMessage,
  ownEmail: string,
  mode: 'reply' | 'all' | 'forward',
) => {
  const own = ownEmail.toLowerCase()
  const seen = new Set([own])
  const unique = (addresses: string[]) =>
    addresses.filter((address) => {
      const key = address.toLowerCase()
      if (!address || seen.has(key)) return false
      seen.add(key)
      return true
    })
  const targets =
    message.from.address.toLowerCase() === own
      ? message.to.map((item) => item.address)
      : [message.from.address]
  const to =
    mode === 'forward'
      ? ''
      : unique(
          mode === 'all'
            ? [...targets, ...message.to.map((item) => item.address)]
            : targets,
        ).join(', ')
  const cc =
    mode === 'all'
      ? unique((message.cc || []).map((item) => item.address)).join(', ')
      : ''
  const subject = message.subject.replace(/^((re|fwd?)\s*:\s*)+/gi, '')
  const content =
    message.html ||
    `<p>${escapeHtml(message.text || '').replace(/\n/g, '<br>')}</p>`
  const attribution = `${message.from.name || message.from.address} · ${message.from.address} · ${new Date(message.date).toLocaleString()}`
  return {
    to,
    cc,
    subject: `${mode === 'forward' ? 'Fwd' : 'Re'}: ${subject}`,
    body: `<p><br></p><blockquote><p>${escapeHtml(attribution)}</p>${content}</blockquote>`,
    inReplyTo: mode === 'forward' ? undefined : message.messageId,
    references:
      mode === 'forward'
        ? []
        : [
            ...new Set([
              ...(message.references || []),
              ...(message.messageId ? [message.messageId] : []),
            ]),
          ],
  }
}

export const loadMessageFiles = async (message: MailMessage) =>
  Promise.all(
    (message.attachments || []).map(async (attachment) => {
      const response = await fetch(
        `/api/messages/${message.uid}/attachments/${attachment.partId}?folder=${encodeURIComponent(message.folder)}`,
      )
      if (!response.ok)
        throw new Error(
          `Could not load ${attachment.filename}. Please try again.`,
        )
      return new File([await response.blob()], attachment.filename, {
        type: attachment.contentType,
      })
    }),
  )
