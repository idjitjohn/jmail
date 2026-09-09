'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useRichEditor } from './useRichEditor'
import './RichEditor.scss'

type Props = {
  defaultValue?: string
  resetToken?: number
  onChange: (html: string) => void
  placeholder?: string
}

const RichEditor = ({
  defaultValue = '',
  resetToken = 0,
  onChange,
  placeholder,
}: Props) => {
  const { t } = useLocale()

  const {
    divRef,
    formats,
    inLink,
    exec,
    toggleLink,
    handleInput,
    handlePaste,
    handleKeyDown,
  } = useRichEditor({
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
          onMouseDown={(e) => {
            e.preventDefault()
            exec('bold')
          }}
          title={t('Bold (⌘B)')}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={`tool-btn italic ${formats.italic ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            exec('italic')
          }}
          title={t('Italic (⌘I)')}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={`tool-btn underline ${formats.underline ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            exec('underline')
          }}
          title={t('Underline (⌘U)')}
        >
          <u>U</u>
        </button>
        <div className="toolbar-sep" />
        <button
          type="button"
          className={`tool-btn link ${inLink ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            toggleLink()
          }}
          title={inLink ? t('Remove link (⌘K)') : t('Insert link (⌘K)')}
        />
      </div>

      <div
        ref={divRef}
        className="editor"
        contentEditable
        role="textbox"
        aria-label={t('Message body')}
        aria-multiline="true"
        spellCheck
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
    </div>
  )
}

export default RichEditor
