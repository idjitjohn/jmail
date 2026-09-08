'use client'

import { useCommandPalette } from './useCommandPalette'
import type { Command } from './types'
import './CommandPalette.scss'

type Props = { commands: Command[]; onClose: () => void }

const CommandPalette = ({ commands, onClose }: Props) => {
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
          <h2 id="command-title">Your inbox, at your fingertips</h2>
          <button type="button" onClick={onClose} aria-label="Close commands">
            Esc
          </button>
        </div>
        <div className="search">
          <input
            autoFocus
            role="combobox"
            aria-label="Search commands"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={
              filtered[active] ? `command-${filtered[active].id}` : undefined
            }
            autoComplete="off"
            placeholder="What would you like to do?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          className="commands"
          id="command-results"
          role="listbox"
          aria-label="Commands"
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
                <strong>{command.label}</strong>
                <span>{command.description}</span>
              </span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
          {!filtered.length && (
            <p className="empty">
              No commands found. Try “compose” or “inbox”.
            </p>
          )}
        </div>
        <div className="footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to explore
          </span>
          <span>
            <kbd>↵</kbd> to choose
          </span>
          {shortcutsEnabled && <span>J / K to move through mail</span>}
        </div>
      </div>
    </dialog>
  )
}

export default CommandPalette
