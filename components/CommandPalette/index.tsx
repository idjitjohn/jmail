'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useCommandPalette } from './useCommandPalette'
import type { Command } from './types'
import './CommandPalette.scss'

type Props = { commands: Command[]; onClose: () => void }

const CommandPalette = ({ commands, onClose }: Props) => {
  const { t } = useLocale()

  const {
    shortcutsEnabled,
    dialogRef,
    query,
    setQuery,
    active,
    setActive,
    filtered,
    run,
    handleKeyDown,
  } = useCommandPalette(commands, onClose)

  return (
    <dialog
      className="CommandPalette"
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="command-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className="surface">
        <div className="heading">
          <h2 id="command-title">{t('Your inbox, at your fingertips')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close commands')}
          >
            {t('Esc')}
          </button>
        </div>
        <div className="search">
          <input
            autoFocus
            role="combobox"
            aria-label={t('Search commands')}
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={
              filtered[active] ? `command-${filtered[active].id}` : undefined
            }
            autoComplete="off"
            placeholder={t('What would you like to do?')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          className="commands"
          id="command-results"
          role="listbox"
          aria-label={t('Commands')}
        >
          {filtered.map((command, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === active}
              id={`command-${command.id}`}
              key={command.id}
              className={`command ${command.icon}${index === active ? ' active' : ''}`}
              onMouseMove={() => setActive(index)}
              onClick={() => run(command)}
            >
              <span className="copy">
                <strong>{t(command.label)}</strong>
                <span>{t(command.description)}</span>
              </span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
          {!filtered.length && (
            <p className="empty">
              {t('No commands found. Try “compose” or “inbox”.')}
            </p>
          )}
        </div>
        <div className="footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> {t('to explore')}
          </span>
          <span>
            <kbd>↵</kbd> {t('to choose')}
          </span>
          {shortcutsEnabled && <span>{t('J / K to move through mail')}</span>}
        </div>
      </div>
    </dialog>
  )
}

export default CommandPalette
