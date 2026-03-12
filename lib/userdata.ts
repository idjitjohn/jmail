import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = '/var/lib/maddy/userdata'

export interface UserData {
  name?: string
  signature?: string
}

function getDataPath(email: string) {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, '')
  if (safe !== email) throw new Error('Invalid email')
  const full = path.resolve(DATA_DIR, `${safe}.json`)
  if (!full.startsWith(DATA_DIR + '/')) throw new Error('Path traversal')
  return full
}

export async function getUserData(email: string): Promise<UserData> {
  try {
    const content = await readFile(getDataPath(email), 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export async function setUserData(email: string, patch: Partial<UserData>): Promise<void> {
  try { await mkdir(DATA_DIR, { recursive: true }) } catch { /* exists */ }
  const current = await getUserData(email)
  await writeFile(getDataPath(email), JSON.stringify({ ...current, ...patch }), 'utf-8')
}
