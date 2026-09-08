/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS module isolation */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { Resolver } = require('node:dns/promises')

const filename = resolve('lib/mail-diagnostics.ts')
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
const originalRequire = subject.require.bind(subject)
subject.require = (name) =>
  name === './maddy-admin'
    ? { getMailServer: async () => ({ domains: [] }) }
    : originalRequire(name)
subject._compile(compiled, filename)
const { checkDns, validateAddress, expectedSpf } = subject.exports

const domain = {
  name: 'example.org',
  mxHost: 'smtp.example.org',
  ipv4: '192.0.2.1',
  ipv6: '2001:db8::1',
  selector: 'default',
  dkimRecord:
    'default._domainkey.example.org. TXT "v=DKIM1; k=rsa; p=public" "key"',
}
const noData = () => {
  throw Object.assign(new Error('No data'), { code: 'ENODATA' })
}

const dns = (context, records = {}) => {
  context.mock.method(Resolver.prototype, 'resolveTxt', async (name) => {
    const values =
      records[name] ??
      {
        'example.org': ['v=spf1 ip4:192.0.2.1 ip6:2001:db8::1 ~all'],
        'default._domainkey.example.org': ['v=DKIM1; k=rsa; p=publickey'],
        '_dmarc.example.org': ['v=DMARC1; p=none'],
      }[name]
    return values ? values.map((value) => [value]) : noData()
  })
  context.mock.method(Resolver.prototype, 'resolveMx', async () => [
    { priority: 10, exchange: 'smtp.example.org' },
  ])
  context.mock.method(Resolver.prototype, 'resolve4', async () => ['192.0.2.1'])
  context.mock.method(Resolver.prototype, 'resolve6', async () => [
    '2001:db8:0:0:0:0:0:1',
  ])
  context.mock.method(Resolver.prototype, 'resolveCname', async () => noData())
  context.mock.method(Resolver.prototype, 'reverse', async () => [
    'smtp.example.org',
  ])
}

test('validates single recipients and blocks mail header injection', () => {
  assert.equal(validateAddress('contact@example.org'), 'contact@example.org')
  for (const value of [
    'a@example.org, b@example.org',
    'a@example.org\r\nBcc: x@y.org',
    'Name <a@example.org>',
    null,
  ]) {
    assert.throws(() => validateAddress(value))
  }
})

test('suggested SPF includes both IP families', () => {
  assert.equal(expectedSpf(domain), 'v=spf1 ip4:192.0.2.1 ip6:2001:db8::1 ~all')
})

test('matching DNS and split DKIM key records pass', async (context) => {
  dns(context)
  const result = await checkDns(domain)
  assert.equal(result.checks.length, 7)
  for (const check of result.checks)
    assert.equal(check.status, 'pass', check.name)
})

test('missing IPv6 authorization reproduces the Gmail SPF failure', async (context) => {
  dns(context, { 'example.org': ['v=spf1 ip4:192.0.2.1 ~all'] })
  const spf = (await checkDns(domain)).checks.find(
    (check) => check.name === 'SPF',
  )
  assert.equal(spf.status, 'fail')
  assert.match(spf.detail, /missing/)
})

test('SPF includes and CIDR require review instead of false pass', async (context) => {
  dns(context, {
    'example.org': [
      'v=spf1 include:provider.org ip4:192.0.2.1 ip6:2001:db8::1 ~all',
    ],
  })
  assert.equal(
    (await checkDns(domain)).checks.find((check) => check.name === 'SPF')
      .status,
    'warning',
  )
})

test('SPF mechanisms after all do not authorize an IP', async (context) => {
  dns(context, { 'example.org': ['v=spf1 -all ip4:192.0.2.1 ip6:2001:db8::1'] })
  assert.notEqual(
    (await checkDns(domain)).checks.find((check) => check.name === 'SPF')
      .status,
    'pass',
  )
})

test('multiple SPF records and mismatched DKIM fail', async (context) => {
  dns(context, {
    'example.org': ['v=spf1 ~all', 'v=spf1 -all'],
    'default._domainkey.example.org': ['v=DKIM1; p=wrong'],
  })
  const checks = (await checkDns(domain)).checks
  assert.equal(checks.find((check) => check.name === 'SPF').status, 'fail')
  assert.equal(checks.find((check) => check.name === 'DKIM').status, 'fail')
})

test('DNS timeouts are not misreported as missing DNS records', async (context) => {
  dns(context)
  context.mock.method(Resolver.prototype, 'resolveMx', async () => {
    throw new Error('query timed out')
  })
  const check = (await checkDns(domain)).checks.find(
    (check) => check.name === 'MX',
  )
  assert.equal(check.status, 'warning')
  assert.match(check.detail, /timed out/)
})
