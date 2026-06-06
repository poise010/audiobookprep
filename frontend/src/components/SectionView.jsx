import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SECTION_ICONS, IconAlert } from './icons'
import PronunciationTable from './PronunciationTable'

const ACTIVE = new Set(['pending', 'generating'])

export default function SectionView({ sectionKey, meta, content, status, pronunciationEntries }) {
  const Icon = SECTION_ICONS[sectionKey]
  const busy = ACTIVE.has(status)

  return (
    <div className="card section-card">
      <div className="section-head">
        <div className="section-head-icon"><Icon /></div>
        <div className="section-head-titles">
          <div className="section-head-eyebrow">{meta.eyebrow}</div>
          <div className="section-head-title">{meta.title}</div>
        </div>
        {busy && <span className="spinner" />}
        {status === 'error' && !busy && (
          <span className="section-head-badge error">
            <IconAlert width={13} height={13} /> Error
          </span>
        )}
      </div>

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
            <IconAlert width={20} height={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <div className="section-error-title">This section couldn't be generated</div>
              <div className="section-error-msg">
                Please try downloading your guide. If the problem persists, contact support.
              </div>
            </div>
          </div>
        ) : (
          <div className={`prose${sectionKey === 'flagged_items' ? ' prose--flagged' : ''}`}>
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
