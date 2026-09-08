import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  defaultPreferences,
  normalizePreferences,
  parsePreferencePatch,
} from '../lib/preferences.ts'

const directory = await mkdtemp(join(tmpdir(), 'jmail-preferences-test-'))
process.env.JMAIL_USERDATA_DIR = directory
const { getUserData, setUserData, updateUserData } =
  await import('../lib/userdata.ts')
after(() => rm(directory, { recursive: true, force: true }))

test('preferences retain intentional false and zero values', () => {
  const preferences = normalizePreferences({
    undoSendSeconds: 0,
    keyboardShortcuts: false,
    showPreviews: false,
  })
  assert.equal(preferences.undoSendSeconds, 0)
  assert.equal(preferences.keyboardShortcuts, false)
  assert.equal(preferences.showPreviews, false)
  assert.equal(preferences.attachmentReminder, true)
  assert.equal(defaultPreferences.undoSendSeconds, 8)
})

test('invalid stored preferences fall back individually', () => {
  assert.deepEqual(normalizePreferences(null), defaultPreferences)
  assert.deepEqual(normalizePreferences([]), defaultPreferences)
  const preferences = normalizePreferences({
    density: 'compact',
    undoSendSeconds: -1,
    attachmentReminder: 'false',
    readingSize: 'huge',
  })
  assert.equal(preferences.density, 'compact')
  assert.equal(preferences.undoSendSeconds, 8)
  assert.equal(preferences.attachmentReminder, true)
  assert.equal(preferences.readingSize, 'standard')
})

test('preference updates reject unknown fields and wrong types', () => {
  for (const invalid of [
    null,
    [],
    {},
    { undoSendSeconds: '10' },
    { undoSendSeconds: 999 },
    { keyboardShortcuts: 'false' },
    { madeUp: true },
    JSON.parse('{"__proto__": {"enabled": true}}'),
  ]) {
    assert.throws(() => parsePreferencePatch(invalid))
  }
  assert.deepEqual(
    parsePreferencePatch({ markReadOnOpen: false, undoSendSeconds: 30 }),
    { markReadOnOpen: false, undoSendSeconds: 30 },
  )
})

test('account settings persist without overwriting profile or template data', async () => {
  const email = 'first@example.test'
  await setUserData(email, {
    name: 'Maya',
    replyTemplates: [{ id: 'one', name: 'Hello', body: 'Hello there' }],
  })
  await Promise.all([
    updateUserData(email, (current) => ({
      ...current,
      preferences: {
        ...normalizePreferences(current.preferences),
        density: 'compact',
      },
    })),
    updateUserData(email, (current) => ({
      ...current,
      preferences: {
        ...normalizePreferences(current.preferences),
        markReadOnOpen: false,
      },
    })),
  ])
  const saved = await getUserData(email)
  assert.equal(saved.preferences.density, 'compact')
  assert.equal(saved.preferences.markReadOnOpen, false)
  assert.equal(saved.name, 'Maya')
  assert.equal(saved.replyTemplates[0].body, 'Hello there')
  assert.deepEqual(await getUserData('second@example.test'), {})
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, `${email}.json`), 'utf8')),
    saved,
  )
})
