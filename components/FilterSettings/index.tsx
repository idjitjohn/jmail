'use client'

import Button from '../Button'
import Spinner from '../Spinner'
import { useFilterSettings } from './useFilterSettings'
import './FilterSettings.scss'

export default function FilterSettings() {
  const { filters, loading, saving, error, saved, addFilter, updateFilter, removeFilter, save } =
    useFilterSettings()

  if (loading) {
    return (
      <div className="FilterSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="FilterSettings">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Mail filters</h2>
          <p className="section-subtitle">Automatically move messages to folders based on sender, subject, or recipient</p>
        </div>

        {filters.length === 0 ? (
          <div className="empty">
            <p>No filters configured</p>
          </div>
        ) : (
          <div className="filter-list">
            {filters.map(f => (
              <div key={f.id} className="filter-card">
                <div className="filter-row">
                  <div className="filter-toggle">
                    <button
                      type="button"
                      className={`toggle ${f.enabled ? 'on' : 'off'}`}
                      onClick={() => updateFilter(f.id, { enabled: !f.enabled })}
                      role="switch"
                      aria-checked={f.enabled}
                    >
                      <span className="thumb" />
                    </button>
                  </div>

                  <div className="filter-fields">
                    <div className="field-group">
                      <label className="field-label">If</label>
                      <select
                        className="field-select"
                        value={f.field}
                        onChange={e => updateFilter(f.id, { field: e.target.value as 'from' | 'subject' | 'to' })}
                      >
                        <option value="from">From</option>
                        <option value="subject">Subject</option>
                        <option value="to">To</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">contains</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="keyword or address"
                        value={f.contains}
                        onChange={e => updateFilter(f.id, { contains: e.target.value })}
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">move to</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="Folder name"
                        value={f.destination}
                        onChange={e => updateFilter(f.id, { destination: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFilter(f.id)}
                    aria-label="Remove filter"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section-footer">
          <Button variant="secondary" size="sm" onClick={addFilter}>Add filter</Button>
          <div className="spacer" />
          {error && <span className="msg error">{error}</span>}
          {saved && <span className="msg success">Saved</span>}
          <Button onClick={save} loading={saving} size="sm" disabled={filters.length === 0}>Save</Button>
        </div>
      </section>
    </div>
  )
}
