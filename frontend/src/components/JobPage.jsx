import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import SectionView from './SectionView'
import Waveform from './Waveform'
import { SECTION_ICONS, IconCheck, IconAlert, IconDownload, IconClock } from './icons'

const META = {
  plot_summary:        { eyebrow: 'Section 1', title: 'Plot Summary' },
  character_breakdown: { eyebrow: 'Section 2', title: 'Character Breakdown' },
  perspective_guide:   { eyebrow: 'Section 3', title: 'Perspective Guide' },
  chapter_summary:     { eyebrow: 'Section 4', title: 'Chapter-by-Chapter' },
  pronunciation_guide: { eyebrow: 'Section 5', title: 'Pronunciation Guide' },
  flagged_items:       { eyebrow: 'Section 6', title: 'Flagged for Review' },
}

const ORDER = Object.keys(META)
const ACTIVE = new Set(['parsing', 'pending', 'generating'])

function ProgressCard({ sectionKey, data, index }) {
  const Icon = SECTION_ICONS[sectionKey]
  const { status } = data
  const cls = status === 'done' ? 'is-done'
    : status === 'error' ? 'is-error'
    : status === 'generating' ? 'is-active' : ''
  return (
    <div className={`card progress-card ${cls}`} style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="pc-icon"><Icon /></div>
      <div className="pc-body">
        <div className="pc-name">{META[sectionKey].title}</div>
        <div className="pc-status">
          {status === 'done' && 'Complete'}
          {status === 'generating' && 'Writing'}
          {status === 'pending' && 'Queued'}
          {status === 'error' && 'Failed'}
        </div>
      </div>
      <div className="pc-right">
        {status === 'generating' && <Waveform />}
        {status === 'pending' && <div className="spinner" />}
        {status === 'done' && <IconCheck className="check-pop" width={20} height={20} style={{ color: 'var(--sage)' }} />}
        {status === 'error' && <IconAlert width={20} height={20} style={{ color: 'var(--rust)' }} />}
      </div>
    </div>
  )
}

export default function JobPage({ onJobUpdated }) {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [active, setActive] = useState('plot_summary')
  const [toast, setToast] = useState(null)
  const [exporting, setExporting] = useState(false)

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const fetchJob = useCallback(async () => {
    try { setJob(await api.getJob(jobId)) } catch {}
  }, [jobId])

  useEffect(() => { setJob(null); setActive('plot_summary'); fetchJob() }, [jobId, fetchJob])

  useEffect(() => {
    if (!job) return
    const sectionsBusy = job.sections && ORDER.some(k => ACTIVE.has(job.sections[k]?.status))
    if (!ACTIVE.has(job.status) && !sectionsBusy) { onJobUpdated?.(); return }
    const t = setInterval(fetchJob, 2000)
    return () => clearInterval(t)
  }, [job, fetchJob, onJobUpdated])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.exportPdf(jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AudiobookPrep_${(job.title || jobId).replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Guide downloaded', 'success')
      fetchJob()
    } catch (e) {
      showToast('Export failed. Please try again.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleRegenerate = async (sectionKey, customInstructions) => {
    try {
      await api.regenerateSection(jobId, sectionKey, customInstructions)
      fetchJob()
      showToast('Section queued for regeneration')
    } catch (e) {
      showToast('Regeneration failed. Please try again.', 'error')
    }
  }

  if (!job) return <SkeletonPage />

  const isGenerating = ACTIVE.has(job.status)
  const sections = job.sections || {}

  const doneSections = ORDER.filter(k => sections[k]?.status === 'done').length
  const allDone = doneSections === ORDER.length

  return (
    <div>
      {/* Header */}
      <div className="guide-header">
        <div className="guide-header-text">
          <div className="eyebrow">Narrator Preparation Guide</div>
          <h1 className="h-section">{job.title || 'Untitled'}</h1>
          <div className="guide-meta">
            {job.author && <span>by {job.author}</span>}
            {job.author && <span className="guide-meta-sep">·</span>}
            <span>{job.word_count?.toLocaleString()} words</span>
            {job.page_count ? (
              <>
                <span className="guide-meta-sep">·</span>
                <span>{job.page_count} pages</span>
              </>
            ) : null}
            {isGenerating && (
              <>
                <span className="guide-meta-sep">·</span>
                <span className="guide-meta-progress">{doneSections} of {ORDER.length} sections</span>
              </>
            )}
          </div>
        </div>
        {!isGenerating && job.status !== 'error' && (
          <button className="btn btn-accent btn-download" onClick={handleExport} disabled={exporting}>
            <IconDownload width={16} height={16} />
            {exporting ? 'Preparing PDF…' : 'Download Guide'}
          </button>
        )}
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div>
          <div className="generating-notice">
            <Waveform />
            <span>
              {job.status === 'parsing'
                ? 'Reading your manuscript — extracting the text and finding chapter breaks…'
                : 'Writing your guide — all six sections run in parallel. This takes 2–5 minutes depending on manuscript length.'}
            </span>
          </div>
          <div className="stack">
            {ORDER.map((k, i) => (
              <ProgressCard key={k} sectionKey={k} data={sections[k] || { status: 'pending' }} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Top-level job error */}
      {job.status === 'error' && (
        <div className="error-banner" style={{ marginBottom: 24 }}>
          <IconAlert className="eb-icon" />
          <div>
            <div className="eb-title">Guide generation failed</div>
            <div className="eb-msg">Something went wrong during generation. Please try uploading your manuscript again.</div>
          </div>
        </div>
      )}

      {/* Guide content */}
      {!isGenerating && job.status !== 'error' && (
        <div>
          {/* Section navigation */}
          <div className="section-nav-wrap">
            <div className="section-nav">
              {ORDER.map(k => {
                const Icon = SECTION_ICONS[k]
                const st = sections[k]?.status
                return (
                  <button
                    key={k}
                    className={`nav-pill ${active === k ? 'active' : ''} ${st === 'error' ? 'has-error' : ''}`}
                    onClick={() => setActive(k)}
                  >
                    <Icon width={14} height={14} />
                    <span>{META[k].title}</span>
                    {st === 'error' && <span className="pill-dot status-error" />}
                    {ACTIVE.has(st) && <span className="pill-dot status-generating" />}
                    {st === 'done' && active !== k && <span className="pill-dot status-done" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active section */}
          {ORDER.map(k => active === k && (
            <SectionView
              key={k}
              sectionKey={k}
              meta={META[k]}
              content={sections[k]?.content || ''}
              status={sections[k]?.status}
              pronunciationEntries={k === 'pronunciation_guide' ? job.pronunciation_entries : undefined}
              onRegenerate={handleRegenerate}
            />
          ))}

          {/* Bottom download CTA */}
          {allDone && (
            <div className="bottom-cta">
              <div className="bottom-cta-note">Guide complete — six of six sections</div>
              <button className="btn btn-accent btn-download" onClick={handleExport} disabled={exporting}>
                <IconDownload width={16} height={16} />
                {exporting ? 'Preparing PDF…' : 'Download Guide as PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <IconCheck width={15} height={15} />}
          {toast.type === 'error' && <IconAlert width={15} height={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function SkeletonPage() {
  return (
    <div>
      <div className="skeleton skel-on-dark skel-line w-40" style={{ height: 26, marginBottom: 8 }} />
      <div className="skeleton skel-on-dark skel-line w-60" style={{ height: 13, marginBottom: 32 }} />
      <div className="stack">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div className="card progress-card" key={i}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skel-line w-40" style={{ margin: 0, marginBottom: 8 }} />
              <div className="skeleton skel-line w-60" style={{ margin: 0, height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
