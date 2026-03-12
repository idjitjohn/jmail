'use client'

import { type Theme } from '@/lib/theme'
import { useAppearanceSettings } from './useAppearanceSettings'
import './AppearanceSettings.scss'

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: 'light', label: 'Light', desc: 'Always use light mode' },
  { value: 'dark', label: 'Dark', desc: 'Always use dark mode' },
  { value: 'system', label: 'System', desc: 'Follow system preference' },
]

export default function AppearanceSettings() {
  const { theme, handleTheme } = useAppearanceSettings()

  return (
    <div className="AppearanceSettings">
      <div className="settings-section">
        <h2 className="section-title">Theme</h2>
        <div className="theme-grid">
          {THEMES.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              className={`theme-card ${theme === value ? 'active' : ''}`}
              onClick={() => handleTheme(value)}
            >
              <div className={`preview preview-${value}`}>
                <div className="preview-sidebar" />
                <div className="preview-content">
                  <div className="preview-bar" />
                  <div className="preview-bar short" />
                </div>
              </div>
              <div className="card-info">
                <span className="card-label">{label}</span>
                <span className="card-desc">{desc}</span>
              </div>
              {theme === value && (
                <span className="check" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
