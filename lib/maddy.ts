import { execFile, spawn } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const MADDY = process.env.MADDY_BIN || '/usr/local/bin/maddy'
const SUDO = '/usr/bin/sudo'

const validatePassword = (password: string) => {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 1000 ||
    /[\r\n\x00]/.test(password)
  )
    throw new Error(
      'Use 8 to 1,000 characters without line breaks for the password.',
    )
}

function sanitizeEmail(email: string): string {
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new Error(`Invalid email address: ${email}`)
  }
  return email
}

export async function listAccounts(): Promise<string[]> {
  const { stdout } = await execFileAsync(
    SUDO,
    ['-n', MADDY, 'imap-acct', 'list'],
    { timeout: 30000 },
  )
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('@'))
}

export async function createAccount(
  email: string,
  password: string,
): Promise<void> {
  const safe = sanitizeEmail(email)
  validatePassword(password)

  // Create IMAP account
  await execFileAsync(SUDO, ['-n', MADDY, 'imap-acct', 'create', safe], {
    timeout: 30000,
  })

  // Create credentials — maddy creds create reads password from stdin
  try {
    await spawnWithStdin(SUDO, ['-n', MADDY, 'creds', 'create', safe], password)
  } catch (error) {
    try {
      await execFileAsync(SUDO, ['-n', MADDY, 'imap-acct', 'remove', safe], {
        timeout: 30000,
      })
    } catch {
      throw new Error(
        'Mailbox creation was incomplete. Review the mailbox before creating it again.',
      )
    }
    throw error
  }
}

export async function deleteAccount(email: string): Promise<void> {
  const safe = sanitizeEmail(email)
  await execFileAsync(SUDO, ['-n', MADDY, 'imap-acct', 'remove', safe], {
    timeout: 30000,
  })
  await execFileAsync(SUDO, ['-n', MADDY, 'creds', 'remove', safe], {
    timeout: 30000,
  })
}

export async function resetPassword(
  email: string,
  password: string,
): Promise<void> {
  const safe = sanitizeEmail(email)
  validatePassword(password)
  await spawnWithStdin(SUDO, ['-n', MADDY, 'creds', 'password', safe], password)
}

function spawnWithStdin(
  cmd: string,
  args: string[],
  input: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    const timeout = setTimeout(() => child.kill('SIGKILL'), 30000)
    let stderr = ''

    child.stderr.on('data', (d: Buffer) => {
      stderr = (stderr + d.toString()).slice(-2000)
    })
    child.stdin.on('error', () => {})
    child.stdin.write(input + '\n')
    child.stdin.end()

    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0) resolve()
      else reject(new Error(stderr || `maddy exited with code ${code}`))
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}
