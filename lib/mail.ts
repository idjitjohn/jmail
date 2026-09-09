import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { mailTlsOptions } from './mail-tls'

const HOST = process.env.MAIL_HOST || 'localhost'
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993')
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')

export function createImapClient(email: string, password: string) {
  const client = new ImapFlow({
    host: HOST,
    port: IMAP_PORT,
    secure: IMAP_PORT === 993,
    doSTARTTLS: IMAP_PORT !== 993,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 60000,
    maxIdleTime: 25000,
    auth: { user: email, pass: password },
    logger: false,
    tls: mailTlsOptions(HOST),
  })
  // Command failures handled by callers; asynchronous socket errors contained
  client.on('error', () => {})
  return client
}

export function createSmtpTransport(email: string, password: string) {
  const secure = SMTP_PORT === 465
  return nodemailer.createTransport({
    host: HOST,
    port: SMTP_PORT,
    secure,
    requireTLS: !secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 60000,
    auth: { user: email, pass: password },
    tls: mailTlsOptions(HOST),
  })
}
