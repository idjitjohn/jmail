'use client'

import { usePreferences } from '../PreferencesProvider/usePreferences'
import './PreferenceStatus.scss'

const PreferenceStatus = () => {
  const { saving, saved, error, retry } = usePreferences()
  return (
    <div
      className={`PreferenceStatus${error ? ' error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      <span>
        {error ||
          (saving
            ? 'Saving your preference…'
            : saved
              ? 'Saved to your account'
              : 'Changes save automatically to your account')}
      </span>
      {error && (
        <button type="button" disabled={saving} onClick={retry}>
          Reload preferences
        </button>
      )}
    </div>
  )
}

export default PreferenceStatus
