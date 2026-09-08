/* eslint-disable @typescript-eslint/no-require-imports -- Isolated route dependencies */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { NextRequest } = require('next/server')

const loadRoute = (
  client,
  session = { email: 'me@example.test', password: 'private-password' },
) => {
  const filename = resolve('app/api/messages/drafts/route.ts')
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const subject = new Module(filename, module)
  subject.filename = filename
  subject.paths = module.paths
  const original = subject.require.bind(subject)
  subject.require = (name) => {
    if (name === '@/lib/auth')
      return {
        getSession: async () => session,
        unauthorized: () => new Response('{}', { status: 401 }),
      }
    if (name === '@/lib/mail') return { createImapClient: () => client }
    if (name === '@/lib/file-store')
      return { withFileLock: async (_file, action) => action() }
    if (name === '@/lib/outgoing')
      return {
        readOutgoing: async () => ({}),
        buildMessage: async () => Buffer.from('draft'),
      }
    return original(name)
  }
  subject._compile(compiled, filename)
  return subject.exports
}
const request = (uid) => {
  const body = new FormData()
  if (uid) body.set('uid', uid)
  body.set('to', 'friend@example.test')
  body.set('subject', 'Draft')
  return new NextRequest('http://localhost/api/messages/drafts', {
    method: 'PUT',
    body,
  })
}
const client = () => {
  const calls = []
  return {
    calls,
    connect: async () => {},
    logout: async () => {},
    close: () => {},
    list: async () => [{ path: 'My Drafts', specialUse: '\\Drafts' }],
    getMailboxLock: async (folder) => {
      calls.push(['lock', folder])
      return { release: () => calls.push(['release']) }
    },
    fetchOne: async () => ({ flags: new Set(['\\Draft']) }),
    append: async (folder, _raw, flags) => {
      calls.push(['append', folder, flags])
      return { uid: 42 }
    },
    messageDelete: async (uid) => calls.push(['delete', uid]),
  }
}

test('draft save uses the server Drafts folder and replaces the old UID only after append', async () => {
  const imap = client()
  const response = await loadRoute(imap).PUT(request('7'))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).uid, 42)
  assert.deepEqual(imap.calls, [
    ['lock', 'My Drafts'],
    ['append', 'My Drafts', ['\\Draft', '\\Seen']],
    ['delete', '7'],
    ['release'],
  ])
})
test('failed append preserves the original draft', async () => {
  const imap = client()
  imap.append = async () => {
    throw new Error('Mailbox unavailable')
  }
  assert.equal((await loadRoute(imap).PUT(request('7'))).status, 400)
  assert.equal(
    imap.calls.some((call) => call[0] === 'delete'),
    false,
  )
})
test('draft endpoints cannot delete a regular message or accept UID ranges', async () => {
  const imap = client()
  imap.fetchOne = async () => ({ flags: new Set(['\\Seen']) })
  assert.equal((await loadRoute(imap).DELETE(request('7'))).status, 400)
  assert.equal((await loadRoute(imap).PUT(request('1:*'))).status, 400)
  assert.equal(
    imap.calls.some((call) => call[0] === 'delete' || call[0] === 'append'),
    false,
  )
})
test('draft endpoints require authentication', async () => {
  assert.equal((await loadRoute(client(), null).PUT(request())).status, 401)
})
