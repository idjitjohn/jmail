'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import PreferenceToggle from '../PreferenceToggle'
import PreferenceStatus from '../PreferenceStatus'
import { useInboxAppearance } from './useInboxAppearance'
import './InboxAppearance.scss'

const InboxAppearance = () => {
  const { t } = useLocale()

  const { preferences, saving, setDensity, setPreviews, setReadingSize } =
    useInboxAppearance()
  return (
    <section
      className="InboxAppearance"
      aria-labelledby="inbox-appearance-title"
    >
      <div className="heading">
        <h2 id="inbox-appearance-title">
          {t('A comfortable place for your mail')}
        </h2>
        <p>
          {t('Give conversations room to breathe, or fit a little more in.')}
        </p>
      </div>
      <div className="card">
        <div className="choice-row">
          <span className="label">{t('Inbox spacing')}</span>
          <div className="choices" role="group" aria-label={t('Inbox spacing')}>
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.density === 'comfortable'}
              onClick={() => setDensity('comfortable')}
            >
              {t('Comfortable')}
            </button>
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.density === 'compact'}
              onClick={() => setDensity('compact')}
            >
              {t('Compact')}
            </button>
          </div>
        </div>
        <PreferenceToggle
          label={t('Message previews')}
          description={t('Show the first few words underneath each subject.')}
          checked={preferences.showPreviews}
          onChange={setPreviews}
          disabled={saving}
        />
        <div className="choice-row">
          <span className="label">{t('Message text size')}</span>
          <div
            className="choices"
            role="group"
            aria-label={t('Message text size')}
          >
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.readingSize === 'standard'}
              onClick={() => setReadingSize('standard')}
            >
              {t('Standard')}
            </button>
            <button
              type="button"
              disabled={saving}
              aria-pressed={preferences.readingSize === 'large'}
              onClick={() => setReadingSize('large')}
            >
              {t('Larger')}
            </button>
          </div>
        </div>
      </div>
      <div
        className={`inbox-preview ${preferences.density}${preferences.showPreviews ? '' : ' no-preview'}`}
        aria-label={t('Inbox appearance preview')}
      >
        <span className="preview-label">{t('A little preview')}</span>
        <div className="sample">
          <div className="sample-copy">
            <strong>{t('Maya Chen')}</strong>
            <span className="sample-subject">
              {t('Something good is on its way')}
            </span>
            {preferences.showPreviews && (
              <p>{t('A few ideas for our next adventure together…')}</p>
            )}
          </div>
          <span className="sample-time">{t('9:41 AM')}</span>
        </div>
        <p className={`reading-sample ${preferences.readingSize}`}>
          {t('A message that’s easy on the eyes.')}
        </p>
      </div>
      <PreferenceStatus />
    </section>
  )
}

export default InboxAppearance
