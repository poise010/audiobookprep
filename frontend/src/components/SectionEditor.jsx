import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SECTION_ICONS, IconRefresh, IconCheck, IconAlert } from './icons'

const ACTIVE = new Set(['pending', 'generating'])

export default function SectionEditor({ sectionKey, meta, content, status, error, onSave, onRegenerate }) {
  const [instructions, setInstructions] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const Icon = SECTION_ICONS[sectionKey]

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'No content yet.' })],
    content: content || '',
    onBlur: ({ editor }) => {
      if (editor.getText().trim()) {
        onSave(editor.getHTML()); setSaved(true); setTimeout(() => setSaved(false), 1600)
      }
    },
  }, [content])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try { await onRegenerate(instructions); setInstructions('') } finally { setRegenerating(false) }
  }

  const busy = ACTIVE.has(status) || regenerating

  return (
    <div className="card editor-card">
      <div className="editor-head">
        <div className="editor-head-icon"><Icon /></div>
        <div className="editor-head-titles">
          <div className="editor-head-eyebrow">{meta.eyebrow}</div>
          <div className="editor-head-title">{meta.title}</div>
        </div>
        {saved && <span className="editor-head-status saved"><IconCheck width={14} height={14} /> Saved</span>}
        {busy && <span className="spinner" />}
        {status === 'error' && !busy && <span className="editor-head-status error"><IconAlert width={14} height={14} /> Error</span>}
      </div>

      <div className="editor-body">
        {busy ? (
          <div>
            <div className="skeleton skel-line w-90" />
            <div className="skeleton skel-line" />
            <div className="skeleton skel-line w-75" />
            <div className="skeleton skel-line w-90" />
            <div className="skeleton skel-line w-60" />
          </div>
        ) : status === 'error' ? (
          <div className="error-banner">
            <IconAlert className="eb-icon" />
            <div>
              <div className="eb-title">This section failed to generate</div>
              <div className="eb-msg">{error || 'Unknown error.'} Resolve it, then Regenerate below.</div>
            </div>
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <div className="regen-bar">
        <input className="regen-input" value={instructions}
          onChange={e => setInstructions(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegenerate()}
          placeholder="Optional notes for regeneration (e.g. “Lean harder into the villain’s Chicago accent”)" />
        <button className="btn btn-ghost btn-sm" onClick={handleRegenerate} disabled={busy}>
          <IconRefresh width={14} height={14} /> {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>
    </div>
  )
}
