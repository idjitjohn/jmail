import { Resolver } from 'dns/promises'
import { isIP } from 'net'
import { randomUUID } from 'crypto'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { getMailServer } from './maddy-admin'
import type { Check, DiagnosticResult, Domain } from '@/components/MailServerAdmin/types'

const resolver = new Resolver({ timeout: 3000, tries: 1 })
const host = process.env.MAIL_HOST || 'localhost'
const smtpPort = Number(process.env.SMTP_PORT || 465)
const imapPort = Number(process.env.IMAP_PORT || 993)
const addressPattern = /^[a-zA-Z0-9._%+\-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

export const validateAddress = (value: unknown): string => {
  if (typeof value !== 'string' || value.length > 254 || !addressPattern.test(value)) throw new Error('Enter a valid email address')
  return value
}

const query = async <T>(operation: () => Promise<T>): Promise<T | null> => {
  try { return await operation() } catch (error) {
    if (['ENODATA', 'ENOTFOUND'].includes((error as NodeJS.ErrnoException).code || '')) return null
    throw error
  }
}

const normalizeIP = (ip: string) => isIP(ip) === 6 ? new URL(`http://[${ip}]/`).hostname : ip

const txt = async (name: string) => (await query(() => resolver.resolveTxt(name)) || []).map(parts => parts.join(''))
const check = async (name: string, operation: () => Promise<Omit<Check, 'name'>>): Promise<Check> => {
  try { return { name, ...await operation() } }
  catch (error) { return { name, status: 'warning', detail: `Check unavailable: ${error instanceof Error ? error.message : 'DNS lookup failed'}` } }
}

export const expectedSpf = (domain: Domain) => ['v=spf1', domain.ipv4 && `ip4:${domain.ipv4}`, domain.ipv6 && `ip6:${domain.ipv6}`, '~all'].filter(Boolean).join(' ')
const keyValue = (record: string) => {
  const joined = [...record.matchAll(/"([^"\n]*)"/g)].map(match => match[1]).join('') || record
  return joined.match(/(?:^|;)\s*p\s*=\s*([^;\s]+)/i)?.[1] || ''
}

export const checkDns = async (domain: Domain): Promise<DiagnosticResult> => ({ checks: await Promise.all([
  check('MX', async () => {
    const values = await query(() => resolver.resolveMx(domain.name)) || []
    return { status: values.some(v => v.exchange.toLowerCase() === domain.mxHost) ? 'pass' : 'fail',
      detail: values.map(v => `${v.priority} ${v.exchange}`).join(', ') || 'No MX record found', expected: `MX @ → 10 ${domain.mxHost}` }
  }),
  check('Mail host', async () => {
    const [v4, v6, aliases] = await Promise.all([query(() => resolver.resolve4(domain.mxHost)), query(() => resolver.resolve6(domain.mxHost)), query(() => resolver.resolveCname(domain.mxHost))])
    const ips = [...v4 || [], ...v6 || []]
    const expected = [domain.ipv4, domain.ipv6].filter(Boolean)
    return { status: aliases?.length || !ips.length || expected.some(ip => !ips.some(value => normalizeIP(value) === normalizeIP(ip))) ? 'fail' : expected.length ? 'pass' : 'warning',
      detail: aliases?.length ? 'MX hosts must point directly to A/AAAA records, without a CNAME or web proxy.' : ips.join(', ') || 'No A/AAAA records found',
      expected: expected.length ? `DNS-only ${domain.mxHost} → ${expected.join(', ')}` : 'Enter the server’s sending IP addresses to compare DNS.' }
  }),
  check('SPF', async () => {
    const records = (await txt(domain.name)).filter(v => /^v=spf1(?:\s|$)/i.test(v))
    const ips = [domain.ipv4 && `ip4:${domain.ipv4}`, domain.ipv6 && `ip6:${domain.ipv6}`].filter(Boolean)
    const record = records[0] || ''
    const terms = record.split(/\s+/)
    const allIndex = terms.findIndex(term => /^[+?~-]?all$/i.test(term))
    const effective = terms.slice(1, allIndex < 0 ? terms.length : allIndex)
    const explicit = ips.every(ip => effective.some(term => {
      const positive = term.replace(/^\+/, '')
      return positive.slice(0, 4) === ip.slice(0, 4) && isIP(positive.slice(4)) && normalizeIP(positive.slice(4)) === normalizeIP(ip.slice(4))
    }))
    const simple = terms.slice(1, -1).every(term => /^ip[46]:/.test(term) && isIP(term.slice(4))) && /^[~-]all$/.test(terms.at(-1) || '')
    const status = records.length !== 1 ? 'fail' : !ips.length || !simple ? 'warning' : explicit ? 'pass' : 'fail'
    return { status,
      detail: records.length > 1 ? 'Multiple SPF records cause authentication failure. Merge into one record.' : !record ? 'No SPF record found' : simple && ips.length && !explicit ? `A configured sending IP is missing from SPF: ${record}` : record,
      expected: ips.length ? `Suggested TXT @: ${expectedSpf(domain)}. Preserve other authorized senders. Includes and CIDR ranges require a full SPF evaluation.` : 'Enter both outgoing IPv4 and IPv6 addresses. DNS presence alone does not prove SPF authentication.' }
  }),
  check('DKIM', async () => {
    const name = `${domain.selector}._domainkey.${domain.name}`
    const values = await txt(name)
    const expected = keyValue(domain.dkimRecord || '')
    const keys = values.map(keyValue).filter(Boolean)
    return { status: !keys.length ? 'fail' : !expected ? 'warning' : keys.length === 1 && keys[0] === expected ? 'pass' : 'fail',
      detail: !expected ? 'Maddy’s public key is unavailable. Apply the domain settings to generate it, then refresh.' : keys[0] === expected && keys.length === 1 ? 'Published public key matches Maddy. A message test is still needed to verify signing.' : 'Published public key is missing or does not match Maddy.',
      expected: domain.dkimRecord || `Publish the generated public key at ${name}` }
  }),
  check('DMARC', async () => {
    const values = (await txt(`_dmarc.${domain.name}`)).filter(v => /^v=DMARC1;/i.test(v))
    return { status: values.length === 1 && /;\s*p=(none|quarantine|reject)(;|$)/i.test(values[0]) ? 'pass' : 'fail',
      detail: values.join('\n') || 'No DMARC record found', expected: 'Initial TXT _dmarc: v=DMARC1; p=none. Review SPF/DKIM alignment before enforcing quarantine or reject.' }
  }),
  ...[domain.ipv4, domain.ipv6].filter(Boolean).map(ip => check(`Reverse DNS ${ip}`, async () => {
    const names = await query(() => resolver.reverse(ip)) || []
    const forward = await Promise.all(names.map(name => query(() => isIP(ip) === 4 ? resolver.resolve4(name) : resolver.resolve6(name))))
    return { status: names.length && forward.some(values => values?.some(value => normalizeIP(value) === normalizeIP(ip))) ? 'pass' : 'fail',
      detail: names.join(', ') || 'No PTR record found', expected: 'The hosting provider must set PTR to a hostname that resolves back to this sending IP.' }
  })),
]) })

const smtp = (email: string, password: string) => nodemailer.createTransport({
  host, port: smtpPort, secure: smtpPort === 465, requireTLS: smtpPort !== 465,
  auth: { user: email, pass: password }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  tls: { rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false' },
})

const imap = (email: string, password: string) => new ImapFlow({
  host, port: imapPort, secure: imapPort === 993, doSTARTTLS: imapPort !== 993,
  auth: { user: email, pass: password }, logger: false,
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  tls: { rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false' },
})

export const checkMailbox = async (email: string, password: string, token?: string): Promise<DiagnosticResult> => {
  const client = imap(email, password)
  const checks: Check[] = []
  try {
    await client.connect()
    checks.push({ name: 'IMAP login', status: 'pass', detail: `Authenticated as ${email}` })
    const lock = await client.getMailboxLock('INBOX')
    try {
      if (token) {
        if (!/^jmail-test-[a-f0-9-]{36}$/.test(token)) throw new Error('Invalid test token')
        const found = await client.search({ subject: token }, { uid: true })
        checks.push({ name: 'Message arrival', status: found && found.length ? 'pass' : 'warning',
          detail: found && found.length ? `Test message found in ${email} INBOX.` : 'Message not found in INBOX yet. Check spam, forwarding rules, and delivery logs, then retry.' })
      } else {
        checks.push({ name: 'Inbox access', status: 'pass', detail: 'Inbox is readable. Send a token from an external provider and check arrival to test public inbound delivery.' })
      }
    } finally { lock.release() }
  } catch (error) {
    checks.push({ name: 'Mailbox check', status: 'fail', detail: error instanceof Error ? error.message : 'IMAP check failed' })
  } finally { client.close() }
  return { checks }
}

export const sendDiagnostic = async (email: string, password: string, recipient: string, mode: string): Promise<DiagnosticResult> => {
  const token = `jmail-test-${randomUUID()}`
  const transport = smtp(email, password)
  try {
    const info = await transport.sendMail({ from: email, to: recipient, subject: token,
      text: `JMail ${mode} test.\n\nTracking token: ${token}\n\nUse this token in Admin > Mail server to check arrival.`,
      disableFileAccess: true, disableUrlAccess: true })
    if (!info.accepted.length || info.rejected.length) throw new Error('SMTP server rejected the test recipient')
    return { token, messageId: info.messageId, checks: [{ name: 'SMTP submission', status: 'pass',
      detail: `Maddy accepted the test for ${recipient}. This does not confirm final delivery. Check the destination inbox and authentication headers.` }] }
  } finally { transport.close() }
}

export const getDiagnosticDomain = async (name: string) => {
  const domain = (await getMailServer()).domains.find(d => d.name === name)
  if (!domain) throw new Error('Select a managed domain')
  return domain
}
