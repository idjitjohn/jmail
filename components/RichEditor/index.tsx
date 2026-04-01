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
          className={`tool-btn link ${inLink ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleLink() }}
          title={inLink ? 'Remove link (⌘K)' : 'Insert link (⌘K)'}
        />
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
