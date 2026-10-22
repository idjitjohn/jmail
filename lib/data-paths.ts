import path from 'path'

// Base folder for app runtime files
const base = process.env.JMAIL_FOLDER
  ? path.resolve(process.env.JMAIL_FOLDER)
  : null
const runtimeDir = base || '/var/lib/maddy/jmail'

const resolve = (override: string | undefined, fallback: string) =>
  path.resolve(override || fallback)

export const SESSION_REVISIONS_FILE = resolve(
  process.env.JMAIL_SESSION_REVISIONS_FILE,
  path.join(runtimeDir, 'session-revisions.json'),
)
export const AUTH_SESSIONS_DIR = resolve(
  process.env.JMAIL_AUTH_SESSIONS_DIR,
  path.join(path.dirname(SESSION_REVISIONS_FILE), 'sessions'),
)
export const SCHEDULED_FILE = resolve(
  process.env.JMAIL_SCHEDULED_FILE,
  path.join(runtimeDir, 'scheduled.json'),
)
export const LATER_FILE = resolve(
  process.env.JMAIL_LATER_FILE,
  path.join(runtimeDir, 'later.json'),
)
export const WORKER_STATUS_FILE = resolve(
  process.env.JMAIL_WORKER_STATUS_FILE,
  path.join(runtimeDir, 'worker.json'),
)
export const USERDATA_DIR = resolve(
  process.env.JMAIL_USERDATA_DIR,
  base ? path.join(base, 'userdata') : '/var/lib/maddy/userdata',
)
