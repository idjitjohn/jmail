import { isIP } from 'node:net'

export const mailTlsOptions = (host: string) => {
  const servername = process.env.MAIL_TLS_SERVERNAME?.trim()
  const configured = process.env.MAIL_TLS_REJECT_UNAUTHORIZED
  const loopback =
    host.toLowerCase() === 'localhost' ||
    host === '::1' ||
    (isIP(host) === 4 && host.startsWith('127.'))

  // Local Maddy compatibility without a certificate hostname
  const rejectUnauthorized =
    configured === undefined
      ? Boolean(servername) || !loopback
      : configured !== 'false'

  return { rejectUnauthorized, ...(servername ? { servername } : {}) }
}
