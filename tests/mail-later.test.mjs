import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ImapFlow } from 'imapflow'

const directory = await mkdtemp(join(tmpdir(), 'jmail-later-'))
process.env.JMAIL_LATER_FILE = join(directory, 'later.json')
process.env.NEXTAUTH_SECRET = 'test-only-later-credentials-secret-32bytes'
process.env.CRON_SECRET = 'test-only-cron'
const { createLater, listLater, changeLater, processLater } =
  await import('../lib/mail-later.ts')
after(() => rm(directory, { recursive: true, force: true }))
const session = {
  email: 'me@example.test',
  password: 'private-password',
  domain: 'example.test',
}

const mockMailbox = (context) => {
  const moves = []
  context.mock.method(ImapFlow.prototype, 'connect', async () => {})
  context.mock.method(ImapFlow.prototype, 'logout', async () => {})
  context.mock.method(ImapFlow.prototype, 'mailboxOpen', async () => ({
    uidValidity: 123n,
  }))
  context.mock.method(ImapFlow.prototype, 'fetchOne', async () => ({
    uid: 7,
    flags: new Set(),
    envelope: { subject: 'Follow up', messageId: '<message@example.test>' },
  }))
  context.mock.method(ImapFlow.prototype, 'list', async () => [
    { path: 'INBOX' },
    { path: 'Snoozed' },
  ])
  context.mock.method(
    ImapFlow.prototype,
    'messageMove',
    async (uid, folder) => {
      moves.push({ uid, folder })
      return { uidMap: new Map([[7, 8]]) }
    },
  )
  context.mock.method(
    ImapFlow.prototype,
    'messageFlagsRemove',
    async () => true,
  )
  context.mock.method(ImapFlow.prototype, 'search', async () => [])
  return moves
}

test('snoozing stores the new UID, protects credentials and restores only once', async (context) => {
  const moves = mockMailbox(context)
  const id = await createLater(session, {
    uid: 7,
    folder: 'INBOX',
    mode: 'snooze',
    dueAt: new Date(Date.now() + 3600000).toISOString(),
  })
  assert.equal(moves[0].folder, 'Snoozed')
  const items = await listLater(session.email)
  assert.equal(items[0].uid, 8)
  assert.equal(items[0].folder, 'Snoozed')
  assert.equal('credential' in items[0], false)
  assert.equal(
    (await readFile(process.env.JMAIL_LATER_FILE, 'utf8')).includes(
      'private-password',
    ),
    false,
  )
  await assert.rejects(
    changeLater('other@example.test', id, 'restore'),
    /not found/,
  )
  await changeLater(session.email, id, 'restore')
  await Promise.all([processLater(), processLater()])
  assert.equal(moves.length, 2)
  assert.deepEqual(moves[1], { uid: '8', folder: 'INBOX' })
  assert.equal((await listLater(session.email)).length, 0)
})

test('a changed mailbox UID validity prevents moving a different message', async (context) => {
  const moves = mockMailbox(context)
  const id = await createLater(session, {
    uid: 7,
    folder: 'INBOX',
    mode: 'snooze',
    dueAt: new Date(Date.now() + 3600000).toISOString(),
  })
  await changeLater(session.email, id, 'restore')
  ImapFlow.prototype.mailboxOpen.mock.mockImplementation(async () => ({
    uidValidity: 999n,
  }))
  await processLater()
  assert.equal(moves.length, 1)
  assert.equal((await listLater(session.email))[0].status, 'failed')
  await writeFile(process.env.JMAIL_LATER_FILE, '[]')
})

test('follow-up reminders resolve when the Inbox contains a reply', async (context) => {
  mockMailbox(context)
  await createLater(session, {
    uid: 7,
    folder: 'Sent',
    mode: 'reminder',
    dueAt: new Date(Date.now() + 3600000).toISOString(),
  })
  const rows = JSON.parse(await readFile(process.env.JMAIL_LATER_FILE, 'utf8'))
  rows[0].dueAt = new Date(0).toISOString()
  await writeFile(process.env.JMAIL_LATER_FILE, JSON.stringify(rows))
  ImapFlow.prototype.search.mock.mockImplementation(async () => [99])
  await processLater()
  assert.equal((await listLater(session.email)).length, 0)
})
