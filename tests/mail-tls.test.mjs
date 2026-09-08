import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tls from 'node:tls'
import { mailTlsOptions } from '../lib/mail-tls.ts'

const environment = (context, values = {}) => {
  for (const name of ['MAIL_TLS_REJECT_UNAUTHORIZED', 'MAIL_TLS_SERVERNAME']) {
    const original = process.env[name]
    context.after(() => {
      if (original === undefined) delete process.env[name]
      else process.env[name] = original
    })
    if (values[name] === undefined) delete process.env[name]
    else process.env[name] = values[name]
  }
}

test('local Maddy remains compatible while remote certificate verification stays enabled', (context) => {
  environment(context)
  for (const host of ['localhost', '127.0.0.1', '127.0.0.2', '::1'])
    assert.equal(mailTlsOptions(host).rejectUnauthorized, false, host)
  for (const host of [
    'mail.atydago.com',
    'localhost.example.test',
    '127.attacker.test',
    '192.168.1.2',
    '2001:db8::1',
  ])
    assert.equal(mailTlsOptions(host).rejectUnauthorized, true, host)
})

test('setting a certificate hostname enables verification even over loopback', (context) => {
  environment(context, { MAIL_TLS_SERVERNAME: 'mail.atydago.com' })
  assert.deepEqual(mailTlsOptions('localhost'), {
    rejectUnauthorized: true,
    servername: 'mail.atydago.com',
  })
})

test('explicit certificate policy overrides the local compatibility default', (context) => {
  environment(context, { MAIL_TLS_REJECT_UNAUTHORIZED: 'true' })
  assert.equal(mailTlsOptions('localhost').rejectUnauthorized, true)
  process.env.MAIL_TLS_REJECT_UNAUTHORIZED = 'false'
  assert.equal(mailTlsOptions('mail.example.test').rejectUnauthorized, false)
})

test('TLS handshake reproduces the localhost mismatch and verifies the configured hostname', async (context) => {
  environment(context)
  const directory = await mkdtemp(join(tmpdir(), 'jmail-login-tls-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  const keyPath = join(directory, 'key.pem')
  const certPath = join(directory, 'cert.pem')
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '1',
      '-subj',
      '/CN=mail.example.test',
      '-keyout',
      keyPath,
      '-out',
      certPath,
    ],
    { stdio: 'ignore' },
  )
  const cert = await readFile(certPath)
  const server = tls.createServer(
    { key: await readFile(keyPath), cert },
    (socket) => socket.end(),
  )
  server.on('tlsClientError', () => {})
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  context.after(() => new Promise((resolve) => server.close(resolve)))
  const connect = (options) =>
    new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: '127.0.0.1',
        port: server.address().port,
        ca: cert,
        ...options,
      })
      socket.setTimeout(3000)
      socket.once('secureConnect', () => {
        socket.destroy()
        resolve()
      })
      socket.once('error', reject)
      socket.once('timeout', () => {
        socket.destroy()
        reject(new Error('TLS test timed out'))
      })
    })
  await assert.rejects(
    connect({ rejectUnauthorized: true, servername: 'localhost' }),
    { code: 'ERR_TLS_CERT_ALTNAME_INVALID' },
  )
  await connect(mailTlsOptions('localhost'))
  process.env.MAIL_TLS_SERVERNAME = 'mail.example.test'
  await connect(mailTlsOptions('localhost'))
  process.env.MAIL_TLS_SERVERNAME = 'wrong.example.test'
  await assert.rejects(connect(mailTlsOptions('localhost')), {
    code: 'ERR_TLS_CERT_ALTNAME_INVALID',
  })
})
