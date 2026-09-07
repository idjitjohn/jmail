import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mentionsAttachment,
  schedulePresets,
  toLocalDateTime,
} from '../lib/compose-utils.ts'
import { buildMailSearch, hasMailAttachments } from '../lib/mail-search.ts'
import { templateToHtml } from '../lib/reply-templates.ts'
import { saveDraft, loadDraft, clearDraft } from '../lib/drafts.ts'

test('reply templates preserve literal text without creating executable HTML', () => {
  assert.equal(
    templateToHtml('<script>alert("hello")</script>\n\nThanks & goodbye'),
    '<p>&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt;</p><p><br></p><p>Thanks &amp; goodbye</p>',
  )
})

test('attachment reminders distinguish new text from quoted correspondence', () => {
  assert.equal(
    mentionsAttachment('<p>Please see the attached proposal.</p>'),
    true,
  )
  assert.equal(mentionsAttachment('<p>I am attaching the file.</p>'), true)
  assert.equal(
    mentionsAttachment(
      '<p>Thanks!</p><blockquote>The attachment is enclosed.</blockquote>',
    ),
    false,
  )
  assert.equal(
    mentionsAttachment('<p>Our team is unattached to the earlier idea.</p>'),
    false,
  )
})

test('schedule presets use local wall time across month and year boundaries', () => {
  const now = new Date(2026, 11, 31, 23, 30)
  const presets = schedulePresets(now)
  assert.equal(presets[1].value, '2027-01-01T09:00')
  assert.equal(
    presets[0].value,
    toLocalDateTime(new Date(now.getTime() + 3600000)),
  )
  assert.equal(toLocalDateTime(new Date(2026, 8, 7, 9, 15)), '2026-09-07T09:15')
})

test('unread and starred filters combine with text on the mail server', () => {
  const unread = buildMailSearch('proposal', 'unread')
  assert.equal(unread.seen, false)
  assert.deepEqual(unread.or, [
    { subject: 'proposal' },
    { from: 'proposal' },
    { to: 'proposal' },
    { body: 'proposal' },
  ])
  assert.deepEqual(buildMailSearch('', 'starred'), { flagged: true, all: true })
  assert.deepEqual(buildMailSearch('', 'all'), { all: true })
})

test('attachment badges detect nested MIME attachments', () => {
  assert.equal(
    hasMailAttachments({
      childNodes: [{ childNodes: [{ disposition: 'attachment' }] }],
    }),
    true,
  )
  assert.equal(hasMailAttachments({ disposition: 'inline' }), false)
  assert.equal(hasMailAttachments(undefined), false)
})

test('drafts remain isolated by account and retain reply context', () => {
  const data = new Map()
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
  const draft = {
    to: 'friend@example.test',
    cc: '',
    subject: 'Hello',
    bodyHtml: '<p>Hi</p>',
    signatureId: null,
    inReplyTo: '<original@example.test>',
  }
  assert.equal(saveDraft(draft, 'first@example.test'), true)
  assert.deepEqual(loadDraft('first@example.test'), draft)
  assert.equal(loadDraft('second@example.test'), null)
  saveDraft({ ...draft, subject: 'Another draft' }, 'second@example.test')
  clearDraft('first@example.test')
  assert.equal(loadDraft('first@example.test'), null)
  assert.equal(loadDraft('second@example.test').subject, 'Another draft')
  globalThis.localStorage.setItem(
    'jmail-compose-draft:bad@example.test',
    '{broken',
  )
  assert.equal(loadDraft('bad@example.test'), null)
})

test('unavailable browser storage does not break composing', () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('Unavailable')
    },
    setItem: () => {
      throw new Error('Quota exceeded')
    },
    removeItem: () => {
      throw new Error('Unavailable')
    },
  }
  assert.equal(loadDraft('first@example.test'), null)
  assert.equal(saveDraft({}, 'first@example.test'), false)
  assert.doesNotThrow(() => clearDraft('first@example.test'))
})
