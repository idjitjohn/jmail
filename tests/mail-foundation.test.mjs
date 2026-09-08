import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { simpleParser } from 'mailparser'
import { seal, unseal } from '../lib/secrets.ts'
import {
  buildMessage,
  readOutgoing,
  validateOutgoing,
} from '../lib/outgoing.ts'
import { groupIntoThreads } from '../lib/threads.ts'
import { replyContext } from '../lib/replies.ts'
import { parseContact } from '../lib/contacts.ts'

process.env.NEXTAUTH_SECRET = 'test-only-foundation-secret-32-bytes-long'
const dir = await mkdtemp(join(tmpdir(), 'jmail-foundation-'))
process.env.JMAIL_SCHEDULED_FILE = join(dir, 'scheduled.json')
const scheduled = await import('../lib/scheduled.ts')
after(() => rm(dir, { recursive: true, force: true }))
const message = {
  to: 'first@example.test, second@example.test',
  cc: 'copy@example.test',
  bcc: 'hidden@example.test',
  subject: 'Hello',
  bodyHtml: '<p>Hello</p>',
  signatureHtml: '',
  attachments: [],
}
const mail = (uid, extra = {}) => ({
  uid,
  folder: 'INBOX',
  messageId: `<${uid}@test>`,
  subject: 'Weekly update',
  from: { address: 'friend@example.test' },
  to: [{ address: 'me@example.test' }],
  date: new Date(2026, 0, uid).toISOString(),
  isRead: false,
  isFlagged: false,
  hasAttachments: false,
  ...extra,
})

test('credentials are encrypted, authenticated, and bound to their purpose', async () => {
  const token = await seal({ password: 'private-password' }, 'session', '1h')
  assert.equal(token.split('.').length, 5)
  assert.equal(token.includes('private-password'), false)
  assert.equal((await unseal(token, 'session')).password, 'private-password')
  await assert.rejects(unseal(token, 'scheduled'))
  const parts = token.split('.')
  parts[3] = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1)
  await assert.rejects(unseal(parts.join('.'), 'session'))
})

test('SMTP copies hide Bcc while saved drafts preserve all recipients and files', async () => {
  const outgoing = {
    ...message,
    attachments: [
      {
        filename: 'hello.csv',
        content: Buffer.from('name,value\nfirst,1').toString('base64'),
        contentType: 'text/csv',
      },
    ],
  }
  const raw = await buildMessage(outgoing, 'me@example.test', 'Name "quoted"')
  assert.equal(/^Bcc:/im.test(raw.toString()), false)
  const parsed = await simpleParser(
    await buildMessage(outgoing, 'me@example.test', 'Name', true),
  )
  assert.equal(parsed.bcc.value[0].address, 'hidden@example.test')
  assert.equal(parsed.to.value.length, 2)
  assert.equal(parsed.attachments[0].content.toString(), 'name,value\nfirst,1')
})

test('outgoing validation rejects injection and invalid recipients', async () => {
  const fd = new FormData()
  fd.set('to', 'person@example.test\r\nBcc: intruder@example.test')
  await assert.rejects(readOutgoing(fd), /line breaks/)
  assert.throws(
    () =>
      validateOutgoing({ ...message, to: 'not-an-address', cc: '', bcc: '' }),
    /valid recipient/,
  )
  assert.doesNotThrow(() => validateOutgoing({ ...message, to: '', cc: '' }))
})

test('same subjects do not merge unrelated mail; references join real replies', () => {
  const threads = groupIntoThreads([
    mail(1),
    mail(2),
    mail(3, { inReplyTo: '<1@test>', subject: 'Re: Weekly update' }),
  ])
  assert.equal(threads.length, 2)
  assert.deepEqual(
    threads
      .find((thread) => thread.messages.length === 2)
      .messages.map((message) => message.uid),
    [1, 3],
  )
  assert.equal(
    groupIntoThreads([mail(1), mail(1, { folder: 'Sent' })]).length,
    2,
  )
})

test('reply all excludes the account and deduplicates To and Cc', () => {
  const original = mail(1, {
    to: [{ address: 'ME@example.test' }, { address: 'other@example.test' }],
    cc: [
      { address: 'friend@example.test' },
      { address: 'other@example.test' },
      { address: 'copy@example.test' },
    ],
    text: '<unsafe>',
  })
  const reply = replyContext(original, 'me@example.test', 'all')
  assert.equal(reply.to, 'friend@example.test, other@example.test')
  assert.equal(reply.cc, 'copy@example.test')
  assert.match(reply.body, /&lt;unsafe&gt;/)
  assert.equal(reply.inReplyTo, original.messageId)
  assert.equal(
    replyContext(original, 'me@example.test', 'forward').inReplyTo,
    undefined,
  )
})

test('contact validation normalizes addresses and rejects unsafe fields', () => {
  assert.equal(
    parseContact({ email: ' Person@Example.test ', name: 'Person' }).email,
    'person@example.test',
  )
  assert.throws(() => parseContact({ email: 'not-valid' }))
  assert.throws(() =>
    parseContact({ email: 'person@example.test', name: 'Name\nBcc: bad' }),
  )
})

test('scheduled messages isolate accounts, encrypt credentials, and claim only once', async () => {
  const payload = {
    ...message,
    sendAt: new Date(Date.now() - 1000).toISOString(),
    userEmail: 'me@example.test',
    userPassword: 'private-password',
  }
  const ids = await Promise.all(
    Array.from({ length: 5 }, () => scheduled.addScheduled(payload)),
  )
  const stored = await readFile(process.env.JMAIL_SCHEDULED_FILE, 'utf8')
  assert.equal(stored.includes('private-password'), false)
  assert.equal(stored.includes('userPassword'), false)
  assert.equal((await scheduled.listScheduled('other@example.test')).length, 0)
  const listed = await scheduled.listScheduled('me@example.test')
  assert.equal(listed.length, 5)
  assert.equal('credential' in listed[0], false)
  const claims = (
    await Promise.all([scheduled.claimDue(), scheduled.claimDue()])
  ).flat()
  assert.equal(claims.length, 5)
  assert.equal(new Set(claims.map((item) => item.id)).size, 5)
  await assert.rejects(
    scheduled.changeScheduled('me@example.test', ids[0]),
    /being sent/,
  )
  await scheduled.finishScheduled(ids[0], 'Check delivery before trying again')
  await assert.rejects(
    scheduled.changeScheduled('other@example.test', ids[0]),
    /not found/,
  )
  await scheduled.changeScheduled('me@example.test', ids[0])
})

test('legacy scheduled credentials migrate without silently replacing corrupt data', async () => {
  await writeFile(
    process.env.JMAIL_SCHEDULED_FILE,
    JSON.stringify([
      {
        ...message,
        id: 'legacy',
        userEmail: 'legacy@example.test',
        userPassword: 'old-secret',
        sendAt: new Date().toISOString(),
      },
    ]),
  )
  await scheduled.listScheduled('legacy@example.test')
  assert.equal(
    (await readFile(process.env.JMAIL_SCHEDULED_FILE, 'utf8')).includes(
      'old-secret',
    ),
    false,
  )
  await writeFile(process.env.JMAIL_SCHEDULED_FILE, '{broken')
  await assert.rejects(scheduled.listScheduled('legacy@example.test'))
  assert.equal(
    await readFile(process.env.JMAIL_SCHEDULED_FILE, 'utf8'),
    '{broken',
  )
})
