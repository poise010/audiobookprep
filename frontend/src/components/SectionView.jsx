import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SECTION_ICONS, IconAlert, IconFlag, IconRefresh } from './icons'
import PronunciationTable from './PronunciationTable'
import Waveform from './Waveform'

const ACTIVE = new Set(['pending', 'generating'])

export default function SectionView({ sectionKey, meta, content, status, pronunciationEntries, onRegenerate }) {
  const Icon = SECTION_ICONS[sectionKey]
  const busy = ACTIVE.has(status)
  const [showRegen, setShowRegen] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0

  const handleRegen = async () => {
    setRegenLoading(true)
    try {
      await onRegenerate(sectionKey, instructions)
      setShowRegen(false)
      setInstructions('')
    } finally {
      setRegenLoading(false)
    }
  }

  return (
    <div className="card section-card">
      <div className="section-head">
        <div className="section-head-icon"><Icon /></div>
        <div className="section-head-titles">
          <div className="section-head-eyebrow">{meta.eyebrow}</div>
          <div className="section-head-title">{meta.title}</div>
        </div>
        <div className="section-head-right">
          {!busy && status !== 'error' && wordCount > 0 && (
            <span className="section-word-count">{wordCount.toLocaleString()} words</span>
          )}
          {busy && <Waveform />}
          {status === 'error' && !busy && (
            <span className="section-head-badge error">
              <IconAlert width={13} height={13} /> Error
            </span>
          )}
          {!busy && onRegenerate && (
            <button
              className={`btn btn-ghost btn-sm regen-btn ${showRegen ? 'regen-btn--open' : ''}`}
              onClick={() => setShowRegen(v => !v)}
              title="Regenerate this section"
            >
              <IconRefresh width={13} height={13} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline regenerate panel */}
      {showRegen && (
        <div className="regen-panel">
          <div className="regen-panel-label">Custom instructions <span className="regen-panel-optional">(optional)</span></div>
          <textarea
            className="regen-textarea"
            rows={2}
            placeholder='E.g. "Focus on dialect notes for the Scottish characters" or leave blank to regenerate with default settings.'
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
          <div className="regen-panel-actions">
            <button className="btn btn-accent btn-sm" onClick={handleRegen} disabled={regenLoading}>
              {regenLoading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Queuing…</> : <><IconRefresh width={13} height={13} /> Regenerate Section</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowRegen(false); setInstructions('') }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="section-body">
        {busy ? (
          <div className="skel-block">
            <div className="skeleton skel-line w-90" />
            <div className="skeleton skel-line" />
            <div className="skeleton skel-line w-75" />
            <div className="skeleton skel-line w-90" />
            <div className="skeleton skel-line w-60" />
            <div className="skeleton skel-line w-75" />
          </div>
        ) : status === 'error' ? (
          <div className="section-error">
            <IconAlert width={20} height={20} style={{ color: 'var(--rust)', flexShrink: 0 }} />
            <div>
              <div className="section-error-title">This section couldn't be generated</div>
              <div className="section-error-msg">
                Use the Regenerate button above to try again. If the problem persists, contact support.
              </div>
            </div>
          </div>
        ) : (
          <div className={`prose${sectionKey === 'flagged_items' ? ' prose--flagged' : ''}`}>
            {sectionKey === 'flagged_items' && (
              <div className="flagged-callout">
                <IconFlag width={18} height={18} />
                <div className="flagged-callout-text">
                  These items could not be definitively resolved and should be confirmed
                  before recording. They are not errors — they are decisions that belong to the director.
                </div>
              </div>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
            {sectionKey === 'pronunciation_guide' && (
              <PronunciationTable entries={pronunciationEntries || []} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
