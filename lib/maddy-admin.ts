import { readJson } from './file-store'
import { spawn } from 'child_process'
import type { Change, ServerState } from '@/components/MailServerAdmin/types'

export const maddyAdmin = <T>(request: object): Promise<T> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      '/usr/bin/sudo',
      ['-n', '/usr/local/sbin/jmail-maddy-admin'],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGTERM'), 210_000)
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
      if (stdout.length > 1_000_000) child.kill('SIGTERM')
    })
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-2000)
    })
    child.stdin.on('error', () => {})
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      try {
        const data = JSON.parse(stdout)
        if (data.error || code !== 0)
          reject(new Error(data.error || 'Maddy admin helper failed'))
        else resolve(data as T)
      } catch {
        reject(
          new Error(
            stderr.includes('password') ||
              stderr.includes('not allowed') ||
              stderr.includes('not found')
              ? 'Server administration is not connected. Run the installer on the Maddy server using the JMail process user.'
              : 'Maddy admin helper unavailable. Check installation and server logs.',
          ),
        )
      }
    })
    child.stdin.end(JSON.stringify(request))
  })

export const getMailServer = async () => {
  const state = await maddyAdmin<ServerState>({ action: 'status' })
  const heartbeat = await readJson<{ lastRun?: string }>(
    process.env.JMAIL_WORKER_STATUS_FILE || '/var/lib/maddy/jmail/worker.json',
    {},
  ).catch(() => ({}) as { lastRun?: string })
  return { ...state, lastWorkerRun: heartbeat.lastRun }
}
export const getManagedDomains = async () =>
  (await getMailServer()).domains.map((d) => d.name)
export const previewMailServer = (change: Change) =>
  maddyAdmin<{ diff: string; digest: string }>({ ...change, action: 'preview' })
