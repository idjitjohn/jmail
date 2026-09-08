'use client'

import PreferenceToggle from '../PreferenceToggle'
import PreferenceStatus from '../PreferenceStatus'
import { useInboxAppearance } from './useInboxAppearance'
import './InboxAppearance.scss'

const InboxAppearance = () => {
  const { preferences, saving, setDensity, setPreviews, setReadingSize } =
    useInboxAppearance()
  return (
    <section
      className="InboxAppearance"
      aria-labelledby="inbox-appearance-title"
    >
      <div className="heading">
        <h2 id="inbox-appearance-title">A comfortable place for your mail</h2>
        <p>Give conversations room to breathe, or fit a little more in.</p>
      </div>
      <div className="card">
        <div className="choice-row">
          <span className="label">Inbox spacing</span>
          <div className="choices" role="group" aria-label="Inbox spacing">
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.density === 'comfortable'}
              onClick={() => setDensity('comfortable')}
            >
              Comfortable
            </button>
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.density === 'compact'}
              onClick={() => setDensity('compact')}
            >
              Compact
            </button>
          </div>
        </div>
        <PreferenceToggle
          label="Message previews"
          description="Show the first few words underneath each subject."
          checked={preferences.showPreviews}
          onChange={setPreviews}
          disabled={saving}
        />
        <div className="choice-row">
          <span className="label">Message text size</span>
          <div className="choices" role="group" aria-label="Message text size">
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.readingSize === 'standard'}
              onClick={() => setReadingSize('standard')}
            >
              Standard
            </button>
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.readingSize === 'large'}
              onClick={() => setReadingSize('large')}
            >
              Larger
            </button>
          </div>
        </div>
      </div>
      <div
        className={`inbox-preview ${preferences.density}${preferences.showPreviews ? '' : ' no-preview'}`}
        aria-label="Inbox appearance preview"
      >
        <span className="preview-label">A little preview</span>
        <div className="sample">
          <div className="sample-copy">
            <strong>Maya Chen</strong>
            <span className="sample-subject">Something good is on its way</span>
            {preferences.showPreviews && (
              <p>A few ideas for our next adventure together…</p>
            )}
          </div>
          <span className="sample-time">9:41 AM</span>
        </div>
        <p className={`reading-sample ${preferences.readingSize}`}>
          A message that’s easy on the eyes.
        </p>
      </div>
      <PreferenceStatus />
    </section>
  )
}

export default InboxAppearance
