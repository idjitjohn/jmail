import { readFile, writeFile, unlink, mkdir, rename, rm } from 'fs/promises'
import { randomUUID } from 'crypto'
import { withFileLock, writeJson } from './file-store'
import path from 'path'

const SIEVE_DIR = path.resolve(process.env.SIEVE_DIR || '/var/lib/maddy/sieve')

// Group-readable so maddy can read scripts written by the app user
const FILE_MODE = 0o660
const DIR_MODE = 0o2770

export interface SieveForwarding {
  address: string
  keepCopy: boolean
}

export interface SieveVacation {
  subject: string
  message: string
  days: number
}

export interface SieveFilter {
  id: string
  field: 'from' | 'subject' | 'to'
  contains: string
  action: 'move'
  destination: string
  enabled: boolean
}

export interface SieveConfig {
  forwarding: SieveForwarding | null
  vacation: SieveVacation | null
  filters?: SieveFilter[]
}

function getSievePath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._%+-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(SIEVE_DIR, `${safe}.sieve`)
  if (!full.startsWith(SIEVE_DIR + '/')) throw new Error('Path traversal')
  return full
}

function getConfigPath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._%+-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(SIEVE_DIR, `${safe}.json`)
  if (!full.startsWith(SIEVE_DIR + '/')) throw new Error('Path traversal')
  return full
}

export async function readSieveConfig(email: string): Promise<SieveConfig> {
  try {
    const content = await readFile(getConfigPath(email), 'utf-8')
    const config = JSON.parse(content)
    if (
      !config ||
      typeof config !== 'object' ||
      Array.isArray(config) ||
      (config.filters !== undefined && !Array.isArray(config.filters))
    )
      throw new Error('Invalid mail rules')
    return { forwarding: null, vacation: null, filters: [], ...config }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return { forwarding: null, vacation: null, filters: [] }
  }
}

export class SieveAccessError extends Error {
  constructor(public path: string) {
    super(
      `Cannot write Sieve files in ${SIEVE_DIR}. The app process lacks write permission.`,
    )
    this.name = 'SieveAccessError'
  }
}

function rethrowAccess(err: unknown): never {
  const e = err as NodeJS.ErrnoException
  if (e?.code === 'EACCES' || e?.code === 'EPERM' || e?.code === 'EROFS') {
    throw new SieveAccessError(e.path || SIEVE_DIR)
  }
  throw err
}

// Returns null on success, a user-facing message on permission failure
export async function trySaveSieveConfig(
  email: string,
  patch: Partial<SieveConfig>,
): Promise<string | null> {
  try {
    await mkdir(SIEVE_DIR, { recursive: true, mode: DIR_MODE }).catch(
      rethrowAccess,
    )
    await withFileLock(getConfigPath(email), async () => {
      const current = await readSieveConfig(email)
      await writeSieveConfig(email, { ...current, ...patch })
    })
    return null
  } catch (err) {
    if (err instanceof SieveAccessError) {
      console.error(`[sieve] ${err.message} (path: ${err.path})`)
      return 'Server cannot save mail rules — storage is not writable. Contact your administrator.'
    }
    throw err
  }
}

export async function writeSieveConfig(
  email: string,
  config: SieveConfig,
): Promise<void> {
  await mkdir(SIEVE_DIR, { recursive: true, mode: DIR_MODE }).catch(
    rethrowAccess,
  )

  const { forwarding, vacation, filters = [] } = config
  const enabledFilters = filters.filter((f) => f.enabled)

  if (!forwarding && !vacation && enabledFilters.length === 0) {
    try {
      await unlink(getSievePath(email))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        rethrowAccess(error)
    }
    await writeJson(getConfigPath(email), config, FILE_MODE).catch(
      rethrowAccess,
    )
    return
  }

  // Build require list
  const requires: string[] = []
  if (enabledFilters.length > 0) requires.push('fileinto')
  if (vacation) requires.push('vacation')
  if (forwarding?.keepCopy) requires.push('copy')

  let script = `require [${requires.map((r) => `"${r}"`).join(', ')}];\n\n`

  // Filter rules
  const quote = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')
  for (const f of enabledFilters) {
    const val = quote(f.contains)
    const dest = quote(f.destination)
    const header =
      f.field === 'from' ? 'From' : f.field === 'to' ? 'To' : 'Subject'
    script += `if header :contains "${header}" "${val}" {\n  fileinto "${dest}";\n  stop;\n}\n\n`
  }

  if (vacation) {
    const msg = vacation.message
      .replace(/\r?\n/g, '\r\n')
      .replace(/^\./gm, '..')
    const subj = quote(vacation.subject)
    script += `vacation :days ${vacation.days} :subject "${subj}" text:\r\n${msg}\r\n.\r\n;\n\n`
  }

  if (forwarding) {
    script += forwarding.keepCopy
      ? `redirect :copy "${forwarding.address}";\n`
      : `redirect "${forwarding.address}";\n`
  }

  const temporary = `${getSievePath(email)}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, script, { encoding: 'utf-8', mode: FILE_MODE })
    await rename(temporary, getSievePath(email))
    await writeJson(getConfigPath(email), config, FILE_MODE)
  } catch (err) {
    rethrowAccess(err)
  } finally {
    await rm(temporary, { force: true })
  }
}
