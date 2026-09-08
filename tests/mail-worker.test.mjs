import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execute = promisify(execFile)

test('the worker authenticates locally without logging its secret', async () => {
  let authorization
  const server = createServer((request, response) => {
    authorization = request.headers.authorization
    assert.equal(request.url, '/api/cron/send-scheduled')
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ processed: 2, reminders: 1 }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const result = await execute(
      process.execPath,
      ['scripts/run-mail-worker.mjs'],
      {
        env: {
          ...process.env,
          CRON_SECRET: 'worker-test-secret',
          JMAIL_WORKER_ORIGIN: `http://127.0.0.1:${server.address().port}`,
        },
      },
    )
    assert.equal(authorization, 'Bearer worker-test-secret')
    assert.match(result.stdout, /2 scheduled messages, 1 reminders/)
    assert.equal(
      (result.stdout + result.stderr).includes('worker-test-secret'),
      false,
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('the worker rejects remote destinations before sending credentials', async () => {
  await assert.rejects(
    execute(process.execPath, ['scripts/run-mail-worker.mjs'], {
      env: {
        ...process.env,
        CRON_SECRET: 'worker-test-secret',
        JMAIL_WORKER_ORIGIN: 'https://example.org',
      },
    }),
    (error) => {
      assert.match(error.stderr, /local JMail instance/)
      assert.equal(error.stderr.includes('worker-test-secret'), false)
      return true
    },
  )
})
