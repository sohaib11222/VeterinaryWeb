import { useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const RichTextEditor = ({ value, onChange, disabled = false }) => {
  const { t } = useLanguage()
  const editorRef = useRef(null)
  const selectionRef = useRef(null)

  useEffect(() => {
    const editor = editorRef.current
    const nextValue = String(value || '')
    if (editor && editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue
    }
  }, [value])

  const rememberSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (!selection || !selectionRef.current) return
    selection.removeAllRanges()
    selection.addRange(selectionRef.current)
  }

  const emitValue = () => onChange(editorRef.current?.innerHTML || '')

  const applyCommand = (command, commandValue = null) => {
    if (disabled || !editorRef.current) return
    editorRef.current.focus()
    restoreSelection()
    document.execCommand(command, false, commandValue)
    rememberSelection()
    emitValue()
  }

  const createLink = () => {
    const url = window.prompt(t('richText.linkPrompt'))
    if (!url) return
    applyCommand('createLink', url.trim())
  }

  const button = (label, icon, command, title, value = null) => (
    <button
      type="button"
      className="btn btn-sm btn-light border"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => applyCommand(command, value)}
    >
      {icon ? <i className={icon} aria-hidden="true" /> : label}
    </button>
  )

  return (
    <div className="border rounded overflow-hidden bg-white">
      <div className="d-flex flex-wrap gap-1 p-2 border-bottom bg-light" role="toolbar" aria-label={t('richText.toolbar')}>
        {button('B', null, 'bold', t('richText.bold'))}
        {button('I', null, 'italic', t('richText.italic'))}
        {button('U', null, 'underline', t('richText.underline'))}
        <span className="border-start mx-1" />
        <select
          className="form-select form-select-sm"
          style={{ width: 142 }}
          defaultValue="p"
          disabled={disabled}
          aria-label={t('richText.textStyle')}
          onMouseDown={rememberSelection}
          onChange={(event) => {
            applyCommand('formatBlock', event.target.value)
            event.target.value = 'p'
          }}
        >
          <option value="p">{t('richText.paragraph')}</option>
          <option value="h1">{t('richText.heading1')}</option>
          <option value="h2">{t('richText.heading2')}</option>
          <option value="h3">{t('richText.heading3')}</option>
          <option value="h4">{t('richText.heading4')}</option>
          <option value="blockquote">{t('richText.quote')}</option>
        </select>
        <span className="border-start mx-1" />
        {button('', 'fa-solid fa-list-ul', 'insertUnorderedList', t('richText.bulleted'))}
        {button('', 'fa-solid fa-list-ol', 'insertOrderedList', t('richText.numbered'))}
        <button
          type="button"
          className="btn btn-sm btn-light border"
          title={t('richText.insertLink')}
          aria-label={t('richText.insertLink')}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={createLink}
        >
          <i className="fa-solid fa-link" aria-hidden="true" />
        </button>
        {button('', 'fa-solid fa-rotate-left', 'undo', t('richText.undo'))}
        {button('', 'fa-solid fa-rotate-right', 'redo', t('richText.redo'))}
        {button('', 'fa-solid fa-eraser', 'removeFormat', t('richText.clearFormatting'))}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={t('richText.editor')}
        data-placeholder={t('richText.placeholder')}
        onInput={() => {
          rememberSelection()
          emitValue()
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        style={{ minHeight: 340, padding: '16px', outline: 'none', lineHeight: 1.7, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      <div className="px-3 py-2 border-top text-muted small">{t('richText.hint')}</div>
    </div>
  )
}

export default RichTextEditor
