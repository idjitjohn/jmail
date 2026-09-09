import {
  mkdir,
  readFile,
  writeFile,
  rename,
  rm,
  stat,
  utimes,
} from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const withFileLock = async <T>(
  file: string,
  action: () => Promise<T>,
): Promise<T> => {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  const lock = `${file}.lock`
  const deadline = Date.now() + 10000
  while (true) {
    try {
      await mkdir(lock, { mode: 0o700 })
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const info = await stat(lock).catch(() => null)
      if (info && Date.now() - info.mtimeMs > 120000) {
        await rm(lock, { recursive: true, force: true })
        continue
      }
      if (Date.now() > deadline)
        throw new Error('Another change is in progress. Please try again.')
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  const heartbeat = setInterval(() => {
    const now = new Date()
    void utimes(lock, now, now).catch(() => {})
  }, 30000)
  try {
    return await action()
  } finally {
    clearInterval(heartbeat)
    await rm(lock, { recursive: true, force: true })
  }
}

export const readJson = async <T>(file: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw error
  }
}

export const writeJson = async (file: string, value: unknown, mode = 0o600) => {
  const temp = `${file}.${randomUUID()}.tmp`
  try {
    await writeFile(temp, JSON.stringify(value), { mode })
    await rename(temp, file)
  } finally {
    await rm(temp, { force: true })
  }
}
