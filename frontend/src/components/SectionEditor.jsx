import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

export default function SectionEditor({ sectionKey, meta, content, status, onSave, onRegenerate }) {
  const [regenInstructions, setRegenInstructions] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Content will appear here once generation is complete…' }),
    ],
    content: content || '',
    onBlur: ({ editor }) => {
      const text = editor.getText()
      if (text.trim()) {
        onSave(editor.getHTML())
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      }
    },
  }, [content])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await onRegenerate(regenInstructions)
      setRegenInstructions('')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="section-editor">
      <div className="section-editor-header">
        <div>
          <div className="section-editor-label">{meta.label}</div>
          <div className="section-editor-title">{meta.icon} {meta.title}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--success)' }}>Saved</span>}
          {status === 'generating' && <div className="section-card-spinner" />}
          {status === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>Error</span>}
        </div>
      </div>

      <div className="tiptap-wrapper">
        {status === 'generating' ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Generating…</p>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <div className="regen-bar">
        <input
          className="regen-input"
          placeholder="Optional: custom instructions for regeneration (e.g. 'Focus more on the villain's Chicago accent')"
          value={regenInstructions}
          onChange={e => setRegenInstructions(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegenerate()}
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={regenerating || status === 'generating'}
        >
          {regenerating ? 'Regenerating…' : '↺ Regenerate'}
        </button>
      </div>
    </div>
  )
}
