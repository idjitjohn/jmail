import MailComposer from 'nodemailer/lib/mail-composer'
import addressparser from 'nodemailer/lib/addressparser'
import { createImapClient, createSmtpTransport } from './mail'
import { htmlToText } from './format'
import type { SessionPayload } from './auth'

export type OutgoingAttachment = {
  filename: string
  content: string
  contentType: string
}
export type OutgoingMessage = {
  to: string
  cc: string
  bcc: string
  subject: string
  bodyHtml: string
  signatureHtml: string
  inReplyTo?: string
  references?: string[]
  attachments: OutgoingAttachment[]
}

export const recipients = (value: string) =>
  addressparser(value, { flatten: true })
    .map((item) => item.address || '')
    .filter(Boolean)

export const readOutgoing = async (fd: FormData): Promise<OutgoingMessage> => {
  const value = (key: string) =>
    typeof fd.get(key) === 'string' ? String(fd.get(key)) : ''
  const files = fd
    .getAll('attachments')
    .filter((item): item is File => item instanceof File && item.size > 0)
  if (files.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024)
    throw new Error('Attachments must total less than 25 MB.')
  const message = {
    to: value('to'),
    cc: value('cc'),
    bcc: value('bcc'),
    subject: value('subject'),
    bodyHtml: value('bodyHtml'),
    signatureHtml: value('signatureHtml'),
    inReplyTo: value('inReplyTo') || undefined,
    references: value('references').split(/\s+/).filter(Boolean),
    attachments: await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()).toString('base64'),
        contentType: file.type || 'application/octet-stream',
      })),
    ),
  }
  if (
    [message.to, message.cc, message.bcc, message.subject].some((field) =>
      /[\r\n]/.test(field),
    )
  )
    throw new Error('Message headers cannot contain line breaks.')
  if (message.bodyHtml.length > 5 * 1024 * 1024)
    throw new Error('This message is too large.')
  return message
}

export const validateOutgoing = (message: OutgoingMessage) => {
  const addresses = [message.to, message.cc, message.bcc].flatMap(recipients)
  if (
    !addresses.length ||
    addresses.some(
      (address) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address),
    )
  )
    throw new Error('Enter valid recipient addresses, separated by commas.')
  if (addresses.length > 100)
    throw new Error('A message can have at most 100 recipients.')
  if (!message.subject.trim()) throw new Error('Add a subject before sending.')
}

export const buildMessage = (
  message: OutgoingMessage,
  email: string,
  name?: string,
  draft = false,
) =>
  new Promise<Buffer>((resolve, reject) => {
    const compiled = new MailComposer({
      from: { address: email, name: name || '' },
      to: message.to,
      cc: message.cc || undefined,
      bcc: message.bcc || undefined,
      subject: message.subject,
      text: htmlToText(message.bodyHtml),
      html:
        message.bodyHtml +
        (message.signatureHtml
          ? `<div class="signature">${message.signatureHtml}</div>`
          : ''),
      inReplyTo: message.inReplyTo,
      references: message.references?.length
        ? message.references
        : message.inReplyTo,
      attachments: message.attachments.map((file) => ({
        ...file,
        content: Buffer.from(file.content, 'base64'),
      })),
    }).compile()
    compiled.keepBcc = draft
    compiled.build((error, raw) => (error ? reject(error) : resolve(raw)))
  })

export const deliverMessage = async (
  session: SessionPayload,
  message: OutgoingMessage,
) => {
  validateOutgoing(message)
  const raw = await buildMessage(message, session.email, session.name)
  const transport = createSmtpTransport(session.email, session.password)
  let result
  try {
    result = await transport.sendMail({
      envelope: {
        from: session.email,
        to: [message.to, message.cc, message.bcc].flatMap(recipients),
      },
      raw,
    })
  } finally {
    transport.close()
  }
  const imap = createImapClient(session.email, session.password)
  let savedToSent = false
  try {
    await imap.connect()
    const folders = await imap.list()
    const sent =
      folders.find((folder) => folder.specialUse === '\\Sent')?.path || 'Sent'
    if (!folders.some((folder) => folder.path === sent))
      await imap.mailboxCreate(sent)
    await imap.append(sent, raw, ['\\Seen'])
    savedToSent = true
  } catch {
    /* Successful SMTP delivery */
  } finally {
    await imap.logout().catch(() => imap.close())
  }
  return { savedToSent, rejected: result.rejected?.map(String) || [] }
}
