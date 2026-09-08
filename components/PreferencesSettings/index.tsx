'use client'

import Link from 'next/link'
import PreferenceToggle from '../PreferenceToggle'
import PreferenceStatus from '../PreferenceStatus'
import { usePreferencesSettings } from './usePreferencesSettings'
import './PreferencesSettings.scss'

const PreferencesSettings = () => {
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
        <p className="eyebrow">Your mail, your rhythm</p>
        <h1>Make the everyday feel easy.</h1>
        <p>A few thoughtful defaults for the way you read and write.</p>
      </div>
      <section className="section" aria-labelledby="composing-heading">
        <h2 id="composing-heading">Composing</h2>
        <div className="card">
          <label className="select-row">
            <span className="copy">
              <strong>Undo send window</strong>
              <span>A little time to catch a typo or change your mind.</span>
            </span>
            <select
              aria-label="Undo send window"
              value={preferences.undoSendSeconds}
              disabled={saving}
              onChange={(event) => setUndoDelay(event.target.value)}
            >
              <option value="0">Send immediately</option>
              <option value="5">5 seconds</option>
              <option value="8">8 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </label>
          <PreferenceToggle
            label="Attachment reminders"
            description="Give me a nudge when I mention a file but haven’t attached one."
            checked={preferences.attachmentReminder}
            onChange={setAttachmentReminder}
            disabled={saving}
          />
        </div>
      </section>
      <section className="section" aria-labelledby="reading-heading">
        <h2 id="reading-heading">Reading & navigating</h2>
        <div className="card">
          <PreferenceToggle
            label="Mark messages as read when opened"
            description="Turn this off if you prefer to mark messages as read yourself."
            checked={preferences.markReadOnOpen}
            onChange={setMarkRead}
            disabled={saving}
          />
          <PreferenceToggle
            label="Single-key shortcuts"
            description="Use C to compose, / to search, and J / K to move through mail. The command menu stays available with ⌘ / Ctrl + K."
            checked={preferences.keyboardShortcuts}
            onChange={setShortcuts}
            disabled={saving}
          />
          <PreferenceToggle
            label="Swipe to delete"
            description="Move messages to Trash with a left swipe. Turn off to avoid accidental deletion."
            checked={preferences.swipeToDelete}
            onChange={setSwipe}
            disabled={saving}
          />
        </div>
      </section>
      <section className="section" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>
        <div className="card">
          <PreferenceToggle
            label="Desktop notifications"
            description="Let me know about new mail while JMail is open in another tab."
            checked={preferences.desktopNotifications}
            onChange={setNotifications}
            disabled={saving}
          />
        </div>
        {notificationError && <p role="alert">{notificationError}</p>}
      </section>
      <div className="related">
        <Link href="/settings/appearance">Fine-tune your inbox appearance</Link>
        <Link href="/settings/templates">Organize your reply templates</Link>
      </div>
      <PreferenceStatus />
    </div>
  )
}

export default PreferencesSettings
