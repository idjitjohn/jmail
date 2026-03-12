'use client'

import { useRichEditor } from './useRichEditor'
import './RichEditor.scss'

interface Props {
  defaultValue?: string
  resetToken?: number
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({
  defaultValue = '',
  resetToken = 0,
  onChange,
  placeholder,
}: Props) {
  const { divRef, formats, inLink, exec, toggleLink, handleInput, handleKeyDown } = useRichEditor({
    defaultValue,
    resetToken,
    onChange,
  })

  return (
    <div className="RichEditor">
      <div className="toolbar">
        <button
          type="button"
          className={`tool-btn ${formats.bold ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); exec('bold') }}
          title="Bold (⌘B)"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={`tool-btn italic ${formats.italic ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); exec('italic') }}
          title="Italic (⌘I)"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={`tool-btn underline ${formats.underline ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); exec('underline') }}
          title="Underline (⌘U)"
        >
          <u>U</u>
        </button>
        <div className="toolbar-sep" />
        <button
          type="button"
          className={`tool-btn ${inLink ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleLink() }}
          title={inLink ? 'Remove link (⌘K)' : 'Insert link (⌘K)'}
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
            <path d="M9 5.5a3 3 0 0 0-2.83 4h.896A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
          </svg>
        </button>
      </div>

      <div
        ref={divRef}
        className="editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
    </div>
  )
}
