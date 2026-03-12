import { readFile, writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'

const SIEVE_DIR = '/var/lib/maddy/sieve'

export interface SieveForwarding {
  address: string
  keepCopy: boolean
}

export interface SieveVacation {
  subject: string
  message: string
  days: number
}

export interface SieveConfig {
  forwarding: SieveForwarding | null
  vacation: SieveVacation | null
}

function getSievePath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(SIEVE_DIR, `${safe}.sieve`)
  if (!full.startsWith(SIEVE_DIR + '/')) throw new Error('Path traversal')
  return full
}

function getConfigPath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, '')
  const full = path.resolve(SIEVE_DIR, `${safe}.json`)
  if (!full.startsWith(SIEVE_DIR + '/')) throw new Error('Path traversal')
  return full
}

export async function readSieveConfig(email: string): Promise<SieveConfig> {
  try {
    const content = await readFile(getConfigPath(email), 'utf-8')
    return JSON.parse(content)
  } catch {
    return { forwarding: null, vacation: null }
  }
}

export async function writeSieveConfig(email: string, config: SieveConfig): Promise<void> {
  try { await mkdir(SIEVE_DIR, { recursive: true }) } catch { /* exists */ }

  // Persist config as source of truth
  await writeFile(getConfigPath(email), JSON.stringify(config), 'utf-8')

  const { forwarding, vacation } = config

  if (!forwarding && !vacation) {
    try { await unlink(getSievePath(email)) } catch { /* not found */ }
    return
  }

  // Build require list
  const requires: string[] = []
  if (vacation) requires.push('vacation')
  if (forwarding?.keepCopy) requires.push('copy')
  if (forwarding) requires.push('redirect')

  let script = `require [${requires.map(r => `"${r}"`).join(', ')}];\n\n`

  if (vacation) {
    const msg = vacation.message.replace(/"/g, '\\"')
    const subj = vacation.subject.replace(/"/g, '\\"')
    script += `vacation :days ${vacation.days} :subject "${subj}" "${msg}";\n\n`
  }

  if (forwarding) {
    script += forwarding.keepCopy
      ? `redirect :copy "${forwarding.address}";\n`
      : `redirect "${forwarding.address}";\n`
  }

  await writeFile(getSievePath(email), script, 'utf-8')
}
