import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'

const HOST = process.env.MAIL_HOST || 'localhost'
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993')
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')

export function createImapClient(email: string, password: string) {
  return new ImapFlow({
    host: HOST,
    port: IMAP_PORT,
    secure: IMAP_PORT === 993,
    auth: { user: email, pass: password },
    logger: false,
    tls: {
      rejectUnauthorized: false,
    },
  })
}

export function createSmtpTransport(email: string, password: string) {
  const secure = SMTP_PORT === 465
  return nodemailer.createTransport({
    host: HOST,
    port: SMTP_PORT,
    secure,
    requireTLS: !secure,
    auth: { user: email, pass: password },
    tls: {
      rejectUnauthorized: false,
    },
  })
}
