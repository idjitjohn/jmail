import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
const secret = process.env.CRON_SECRET
if (!secret) {
  console.error(
    'CRON_SECRET is missing. Configure it in the JMail environment and restart the app.',
  )
  process.exitCode = 1
} else {
  try {
    const origin = new URL(
      process.env.JMAIL_WORKER_ORIGIN ||
        `http://127.0.0.1:${process.env.PORT || 3000}`,
    )
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname))
      throw new Error('The worker must call the local JMail instance.')
    const response = await fetch(new URL('/api/cron/send-scheduled', origin), {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(110000),
    })
    if (!response.ok)
      throw new Error(`Mail worker returned HTTP ${response.status}`)
    const result = await response.json()
    console.log(
      `Mail worker finished: ${result.processed || 0} scheduled messages, ${result.reminders || 0} reminders.`,
    )
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Mail worker could not finish.',
    )
    process.exitCode = 1
  }
}
