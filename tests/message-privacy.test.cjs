/* eslint-disable @typescript-eslint/no-require-imports -- Isolated route dependencies */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { NextRequest } = require('next/server')

const route = () => {
  const filename = resolve('app/api/messages/[uid]/route.ts')
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
        getSession: async () => ({
          email: 'me@example.test',
          password: 'test',
        }),
        unauthorized: () => new Response('{}', { status: 401 }),
      }
    if (name === '@/lib/userdata') return { getUserData: async () => ({}) }
    if (name === '@/lib/preferences')
      return { normalizePreferences: () => ({ markReadOnOpen: false }) }
    if (name === '@/lib/mail')
      return {
        createImapClient: () => ({
          connect: async () => {},
          mailboxOpen: async () => {},
          logout: async () => {},
          fetch: async function* () {
            yield {
              uid: 7,
              flags: new Set(),
              envelope: {
                from: [{ address: 'sender@example.test' }],
                to: [{ address: 'me@example.test' }],
                date: new Date(),
                subject: 'Privacy',
              },
              source: Buffer.from(
                'From: sender@example.test\r\nTo: me@example.test\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<div style="color: red; background: url(https://tracker.example/pixel)"><img src="https://tracker.example/pixel" onerror="alert(1)"><script>alert(1)</script><a href="data:text/html,unsafe">unsafe</a><strong>Safe text</strong></div>',
              ),
            }
          },
        }),
      }
    return original(name)
  }
  subject._compile(compiled, filename)
  return subject.exports
}

test('mail reading blocks remote pixels, CSS fetches, scripts and data links by default', async () => {
  const response = await route().GET(
    new NextRequest('http://localhost/api/messages/7'),
    { params: Promise.resolve({ uid: '7' }) },
  )
  const message = await response.json()
  assert.equal(response.status, 200)
  assert.equal(message.remoteImagesBlocked, true)
  assert.equal(message.html.includes('tracker.example'), false)
  assert.equal(message.html.includes('script'), false)
  assert.equal(message.html.includes('onerror'), false)
  assert.equal(message.html.includes('data:text/html'), false)
  assert.match(message.html, /color:red/)
  assert.match(message.html, /<strong>Safe text<\/strong>/)
})

test('show images requires an explicit message request and keeps HTML sanitization', async () => {
  const response = await route().GET(
    new NextRequest('http://localhost/api/messages/7?images=show'),
    { params: Promise.resolve({ uid: '7' }) },
  )
  const message = await response.json()
  assert.equal(message.remoteImagesBlocked, false)
  assert.match(message.html, /src="https:\/\/tracker.example\/pixel"/)
  assert.equal(message.html.includes('onerror'), false)
  assert.equal(message.html.includes('background:'), false)
})
