'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'


import Link from 'next/link'
import PreferenceToggle from '../PreferenceToggle'
import PreferenceStatus from '../PreferenceStatus'
import { usePreferencesSettings } from './usePreferencesSettings'
import './PreferencesSettings.scss'

const PreferencesSettings = () => {
  const { t } = useLocale()

  const {
    notificationError,
    setNotifications,
    preferences,
    saving,
    setUndoDelay,
    setAttachmentReminder,
    setMarkRead,
    setShortcuts,
    setSwipe,
  } = usePreferencesSettings()
  return (
    <div className="PreferencesSettings">
      <div className="heading">
        <p className="eyebrow">{t('Your mail, your rhythm')}</p>
        <h1>{t('Make the everyday feel easy.')}</h1>
        <p>{t('A few thoughtful defaults for the way you read and write.')}</p>
      </div>
      <section className="section" aria-labelledby="composing-heading">
        <h2 id="composing-heading">{t('Composing')}</h2>
        <div className="card">
          <label className="select-row">
            <span className="copy">
              <strong>{t('Undo send window')}</strong>
              <span>
                {t('A little time to catch a typo or change your mind.')}
              </span>
            </span>
            <select
              aria-label={t('Undo send window')}
              value={preferences.undoSendSeconds}
              disabled={saving}
              onChange={(event) => setUndoDelay(event.target.value)}
            >
              <option value="0">{t('Send immediately')}</option>
              <option value="5">{t('5 seconds')}</option>
              <option value="8">{t('8 seconds')}</option>
              <option value="10">{t('10 seconds')}</option>
              <option value="30">{t('30 seconds')}</option>
            </select>
          </label>
          <PreferenceToggle
            label={t('Attachment reminders')}
            description={t(
              'Give me a nudge when I mention a file but haven’t attached one.',
            )}
            checked={preferences.attachmentReminder}
            onChange={setAttachmentReminder}
            disabled={saving}
          />
        </div>
      </section>
      <section className="section" aria-labelledby="reading-heading">
        <h2 id="reading-heading">{t('Reading & navigating')}</h2>
        <div className="card">
          <PreferenceToggle
            label={t('Mark messages as read when opened')}
            description={t(
              'Turn this off if you prefer to mark messages as read yourself.',
            )}
            checked={preferences.markReadOnOpen}
            onChange={setMarkRead}
            disabled={saving}
          />
          <PreferenceToggle
            label={t('Single-key shortcuts')}
            description={t(
              'Use C to compose, / to search, and J / K to move through mail. The command menu stays available with ⌘ / Ctrl + K.',
            )}
            checked={preferences.keyboardShortcuts}
            onChange={setShortcuts}
            disabled={saving}
          />
          <PreferenceToggle
            label={t('Swipe to delete')}
            description={t(
              'Move messages to Trash with a left swipe. Turn off to avoid accidental deletion.',
            )}
            checked={preferences.swipeToDelete}
            onChange={setSwipe}
            disabled={saving}
          />
        </div>
      </section>
      <section className="section" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">{t('Notifications')}</h2>
        <div className="card">
          <PreferenceToggle
            label={t('Desktop notifications')}
            description={t(
              'Let me know about new mail while JMail is open in another tab.',
            )}
            checked={preferences.desktopNotifications}
            onChange={setNotifications}
            disabled={saving}
          />
        </div>
        {notificationError && <p role="alert">{t(notificationError)}</p>}
      </section>
      <div className="related">
        <Link href="/settings/appearance">
          {t('Fine-tune your inbox appearance')}
        </Link>
        <Link href="/settings/templates">
          {t('Organize your reply templates')}
        </Link>
      </div>
      <PreferenceStatus />
    </div>
  )
}

export default PreferencesSettings
