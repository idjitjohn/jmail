'use client'

import { useLanguageSelector } from './useLanguageSelector'
import './LanguageSelector.scss'

const LanguageSelector = () => {
  const { locale, saving, error, t, id, change } = useLanguageSelector()
  return (
    <div className="LanguageSelector" aria-busy={saving}>
      <label className="label" htmlFor={id}>
        {t('Language')}
      </label>
      <select
        id={id}
        className="select"
        value={locale}
        disabled={saving}
        onChange={(event) => change(event.target.value)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="enUS" lang="en-US">
          English (US)
        </option>
        <option value="frFR" lang="fr-FR">
          Français (France)
        </option>
      </select>
      {error && (
        <p className="error" id={`${id}-error`} role="alert">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export default LanguageSelector
