import { execFile, spawn } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const MADDY = process.env.MADDY_BIN || '/usr/local/bin/maddy'

function sanitizeEmail(email: string): string {
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new Error(`Invalid email address: ${email}`)
  }
  return email
}

export async function listAccounts(): Promise<string[]> {
  const { stdout } = await execFileAsync(MADDY, ['imap-acct', 'list'])
  return stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('@'))
}

export async function createAccount(email: string, password: string): Promise<void> {
  const safe = sanitizeEmail(email)

  // Create IMAP account
  await execFileAsync(MADDY, ['imap-acct', 'create', safe])

  // Create credentials — maddy creds create reads password from stdin
  await spawnWithStdin(MADDY, ['creds', 'create', safe], password)
}

export async function deleteAccount(email: string): Promise<void> {
  const safe = sanitizeEmail(email)
  await execFileAsync(MADDY, ['imap-acct', 'remove', safe])
  await execFileAsync(MADDY, ['creds', 'remove', safe])
}

export async function resetPassword(email: string, password: string): Promise<void> {
  const safe = sanitizeEmail(email)
  await spawnWithStdin(MADDY, ['creds', 'password', safe], password)
}

function spawnWithStdin(cmd: string, args: string[], input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    let stderr = ''

    child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    child.stdin.write(input + '\n')
    child.stdin.end()

    child.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(stderr || `maddy exited with code ${code}`))
    })

    child.on('error', reject)
  })
}
