'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import Button from '../Button'
import Spinner from '../Spinner'
import { useFilterSettings } from './useFilterSettings'
import './FilterSettings.scss'

const FilterSettings = () => {
  const { t } = useLocale()

  const {
    filters,
    loading,
    saving,
    error,
    saved,
    ready,
    active,
    reload,
    addFilter,
    updateFilter,
    removeFilter,
    save,
  } = useFilterSettings()

  if (loading) {
    return (
      <div className="FilterSettings">
        <div className="loading">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="FilterSettings">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('Mail filters')}</h2>
          <p className="section-subtitle">
            {t(
              'Automatically move messages to folders based on sender, subject, or recipient',
            )}
          </p>
        </div>

        {ready && !active && (
          <p role="status">
            {t(
              'Rules are saved here, but filtering is not confirmed active. Ask your administrator to enable mail filters.',
            )}
          </p>
        )}
        {!ready && (
          <Button variant="secondary" onClick={reload}>
            {t('Reload filters')}
          </Button>
        )}
        {ready && filters.length === 0 ? (
          <div className="empty">
            <p>{t('No filters configured')}</p>
          </div>
        ) : (
          <div className="filter-list">
            {filters.map((f) => (
              <div key={f.id} className="filter-card">
                <div className="filter-row">
                  <div className="filter-toggle">
                    <button
                      type="button"
                      className={`toggle ${f.enabled ? 'on' : 'off'}`}
                      onClick={() =>
                        updateFilter(f.id, { enabled: !f.enabled })
                      }
                      role="switch"
                      aria-label={t('Enable filter')}
                      disabled={saving}
                      aria-checked={f.enabled}
                    >
                      <span className="thumb" />
                    </button>
                  </div>

                  <div className="filter-fields">
                    <div className="field-group">
                      <label className="field-label">{t('If')}</label>
                      <select
                        className="field-select"
                        aria-label={t('Message field')}
                        disabled={saving}
                        value={f.field}
                        onChange={(e) =>
                          updateFilter(f.id, {
                            field: e.target.value as 'from' | 'subject' | 'to',
                          })
                        }
                      >
                        <option value="from">{t('From')}</option>
                        <option value="subject">{t('Subject')}</option>
                        <option value="to">{t('To')}</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">{t('contains')}</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder={t('keyword or address')}
                        aria-label={t('Text to match')}
                        disabled={saving}
                        value={f.contains}
                        onChange={(e) =>
                          updateFilter(f.id, { contains: e.target.value })
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">{t('move to')}</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder={t('Folder name')}
                        aria-label={t('Destination folder')}
                        disabled={saving}
                        value={f.destination}
                        onChange={(e) =>
                          updateFilter(f.id, { destination: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFilter(f.id)}
                    aria-label={t('Remove filter')}
                    disabled={saving}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section-footer">
          <Button
            variant="secondary"
            size="sm"
            onClick={addFilter}
            disabled={!ready || saving}
          >
            {t('Add filter')}
          </Button>
          <div className="spacer" />
          {error && <span className="msg error">{t(error)}</span>}
          {saved && <span className="msg success">{t('Saved')}</span>}
          <Button onClick={save} loading={saving} size="sm" disabled={!ready}>
            {t('Save')}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default FilterSettings
