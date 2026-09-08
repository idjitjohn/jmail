/* eslint-disable @typescript-eslint/no-require-imports -- Isolated route dependencies */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { NextRequest } = require('next/server')

const load = (route = 'auth/login', options = {}) => {
  const calls = []
  const client = {
    connect: async () => {
      calls.push('connect')
      if (options.connectionError) throw options.connectionError
    },
    logout: async () => calls.push('logout'),
    close: () => calls.push('close'),
  }
  const compile = (relative) => {
    const filename = resolve(relative)
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
      if (name === '@/lib/mail') return { createImapClient: () => client }
      if (name === '@/lib/rate-limit') return { rateLimit: () => true }
      if (name === '@/lib/mail-errors') return compile('lib/mail-errors.ts')
      if (name === '@/lib/auth')
        return {
          createSession: async (session) => {
            calls.push(['session', session])
            if (options.sessionError) throw options.sessionError
            return 'encrypted-session'
          },
          extractDomain: (email) => email.split('@')[1],
          getSession: async () =>
            options.unauthenticated
              ? null
              : { email: 'me@example.test', password: 'old-password' },
          unauthorized: () => new Response('{}', { status: 401 }),
        }
      if (name === '@/lib/maddy')
        return {
          resetPassword: async (...args) => calls.push(['reset', ...args]),
        }
      if (name === 'next/headers')
        return {
          cookies: async () => ({
            set: (...args) => calls.push(['cookie', ...args]),
          }),
        }
      return original(name)
    }
    subject._compile(compiled, filename)
    return subject.exports
  }
  return { calls, POST: compile(`app/api/${route}/route.ts`).POST }
}

const request = (
  body = { email: 'me@example.test', password: 'private-password' },
) =>
  new NextRequest('https://jmail.example.test/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })

test('login returns 401 only when IMAP rejects the credentials', async () => {
  const route = load('auth/login', {
    connectionError: Object.assign(new Error('private-password'), {
      authenticationFailed: true,
    }),
  })
  const response = await route.POST(request())
  assert.equal(response.status, 401)
  assert.equal((await response.json()).code, 'INVALID_CREDENTIALS')
  assert.deepEqual(route.calls, ['connect', 'close'])
  assert.equal(response.cookies.get('session'), undefined)
})

test('certificate failures and connection outages are not reported as bad passwords', async () => {
  for (const [code, expected] of [
    ['ERR_TLS_CERT_ALTNAME_INVALID', 'MAIL_TLS_ERROR'],
    ['DEPTH_ZERO_SELF_SIGNED_CERT', 'MAIL_TLS_ERROR'],
    ['ECONNREFUSED', 'MAIL_UNAVAILABLE'],
  ]) {
    const route = load('auth/login', {
      connectionError: Object.assign(new Error('private-password'), { code }),
    })
    const response = await route.POST(request())
    assert.equal(response.status, 503)
    const body = await response.json()
    assert.equal(body.code, expected)
    assert.doesNotMatch(body.error, /private-password/)
    assert.deepEqual(route.calls, ['connect', 'close'])
  }
})

test('an unavailable IMAP authentication backend is not a credential rejection', async () => {
  const route = load('auth/login', {
    connectionError: {
      authenticationFailed: true,
      serverResponseCode: 'UNAVAILABLE',
    },
  })
  const response = await route.POST(request())
  assert.equal(response.status, 503)
  assert.equal((await response.json()).code, 'MAIL_UNAVAILABLE')
})

test('session configuration errors acknowledge that the password was accepted', async () => {
  const route = load('auth/login', {
    sessionError: new Error('secret configuration details'),
  })
  const response = await route.POST(request())
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.code, 'SESSION_CONFIGURATION_ERROR')
  assert.match(body.error, /password was accepted/)
  assert.doesNotMatch(body.error, /secret configuration details/)
  assert.equal(route.calls.at(-1), 'logout')
  assert.equal(response.cookies.get('session'), undefined)
})

test('successful login sets a session and closes the IMAP connection', async () => {
  const route = load()
  const response = await route.POST(request())
  assert.equal(response.status, 200)
  assert.equal(response.cookies.get('session').value, 'encrypted-session')
  assert.equal(route.calls.at(-1), 'logout')
  assert.equal(route.calls[1][1].password, 'private-password')
})

test('password changes preserve credentials when IMAP or session setup fails', async () => {
  for (const options of [
    { connectionError: { code: 'ERR_TLS_CERT_ALTNAME_INVALID' } },
    { sessionError: new Error('Missing secret') },
  ]) {
    const route = load('settings/password', options)
    const response = await route.POST(
      request({ currentPassword: 'old-password', newPassword: 'new-password' }),
    )
    assert.equal(response.status, 503)
    assert.equal(
      route.calls.some((call) => Array.isArray(call) && call[0] === 'reset'),
      false,
    )
    assert.equal(
      route.calls.some((call) => Array.isArray(call) && call[0] === 'cookie'),
      false,
    )
    assert.ok(route.calls.includes('close'))
  }
})

test('password changes validate the session before updating Maddy and issuing the cookie', async () => {
  const route = load('settings/password')
  const response = await route.POST(
    request({ currentPassword: 'old-password', newPassword: 'new-password' }),
  )
  assert.equal(response.status, 200)
  assert.deepEqual(
    route.calls.map((call) => (Array.isArray(call) ? call[0] : call)),
    ['connect', 'close', 'session', 'reset', 'cookie'],
  )
})

test('login failures log useful error codes without passwords or server responses', async (context) => {
  const entries = []
  context.mock.method(console, 'error', (...args) => entries.push(args))
  for (const code of ['ERR_TLS_CERT_ALTNAME_INVALID', 'private-password']) {
    const route = load('auth/login', {
      connectionError: Object.assign(new Error('private-password'), {
        code,
        response: 'private-password',
        authenticationFailed: false,
      }),
    })
    await route.POST(request())
  }
  assert.deepEqual(entries[0], [
    '[auth/login]',
    {
      stage: 'imap',
      category: 'MAIL_TLS_ERROR',
      reason: 'ERR_TLS_CERT_ALTNAME_INVALID',
    },
  ])
  assert.deepEqual(entries[1], [
    '[auth/login]',
    {
      stage: 'imap',
      category: 'MAIL_UNAVAILABLE',
      reason: 'MAIL_UNAVAILABLE',
    },
  ])
  assert.doesNotMatch(JSON.stringify(entries), /private-password|me@example/)
})

test('missing session secrets appear in server diagnostics without leaking the secret', async (context) => {
  const entries = []
  context.mock.method(console, 'error', (...args) => entries.push(args))
  const original = process.env.NEXTAUTH_SECRET
  process.env.NEXTAUTH_SECRET = 'short-private-secret'
  context.after(() => {
    if (original === undefined) delete process.env.NEXTAUTH_SECRET
    else process.env.NEXTAUTH_SECRET = original
  })
  await load('auth/login', {
    sessionError: new Error('short-private-secret'),
  }).POST(request())
  assert.equal(entries[0][1].reason, 'NEXTAUTH_SECRET_MISSING_OR_WEAK')
  assert.doesNotMatch(
    JSON.stringify(entries),
    /short-private-secret|private-password/,
  )
})
