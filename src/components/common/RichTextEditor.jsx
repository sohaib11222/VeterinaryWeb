import { useEffect, useRef } from 'react'

const RichTextEditor = ({ value, onChange, disabled = false }) => {
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
    const url = window.prompt('Enter the link URL (https://...)')
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
      <div className="d-flex flex-wrap gap-1 p-2 border-bottom bg-light" role="toolbar" aria-label="Post formatting tools">
        {button('B', null, 'bold', 'Bold')}
        {button('I', null, 'italic', 'Italic')}
        {button('U', null, 'underline', 'Underline')}
        <span className="border-start mx-1" />
        <select
          className="form-select form-select-sm"
          style={{ width: 142 }}
          defaultValue="p"
          disabled={disabled}
          aria-label="Text style"
          onMouseDown={rememberSelection}
          onChange={(event) => {
            applyCommand('formatBlock', event.target.value)
            event.target.value = 'p'
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="border-start mx-1" />
        {button('', 'fa-solid fa-list-ul', 'insertUnorderedList', 'Bulleted list')}
        {button('', 'fa-solid fa-list-ol', 'insertOrderedList', 'Numbered list')}
        <button
          type="button"
          className="btn btn-sm btn-light border"
          title="Insert link"
          aria-label="Insert link"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={createLink}
        >
          <i className="fa-solid fa-link" aria-hidden="true" />
        </button>
        {button('', 'fa-solid fa-rotate-left', 'undo', 'Undo')}
        {button('', 'fa-solid fa-rotate-right', 'redo', 'Redo')}
        {button('', 'fa-solid fa-eraser', 'removeFormat', 'Clear formatting')}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Post content editor"
        data-placeholder="Write your post content here..."
        onInput={() => {
          rememberSelection()
          emitValue()
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        style={{ minHeight: 340, padding: '16px', outline: 'none', lineHeight: 1.7, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      <div className="px-3 py-2 border-top text-muted small">Use the toolbar to format headings, text, lists, quotes, and links.</div>
    </div>
  )
}

export default RichTextEditor
