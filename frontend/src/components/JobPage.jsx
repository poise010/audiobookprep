import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import SectionEditor from './SectionEditor'
import { SECTION_ICONS, IconCheck, IconAlert, IconDownload, IconLibrary, IconClock } from './icons'

const META = {
  plot_summary:        { eyebrow: 'Section 1', title: 'Plot Summary' },
  character_breakdown: { eyebrow: 'Section 2', title: 'Character Breakdown' },
  perspective_guide:   { eyebrow: 'Section 3', title: 'Perspective Guide' },
  chapter_summary:     { eyebrow: 'Section 4', title: 'Chapter-by-Chapter' },
  pronunciation_guide: { eyebrow: 'Section 5', title: 'Pronunciation Guide' },
}
const ORDER = Object.keys(META)
const ACTIVE = new Set(['pending', 'generating'])

function ProgressCard({ sectionKey, data }) {
  const Icon = SECTION_ICONS[sectionKey]
  const { status } = data
  const cls = status === 'done' ? 'is-done' : status === 'error' ? 'is-error' : ''
  const words = data.content ? data.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length : 0
  return (
    <div className={`card progress-card ${cls}`}>
      <div className="pc-icon"><Icon /></div>
      <div className="pc-body">
        <div className="pc-name">{META[sectionKey].title}</div>
        <div className="pc-status">
          {status === 'done' && `Complete · ${words.toLocaleString()} words`}
          {status === 'generating' && 'Writing…'}
          {status === 'pending' && 'Queued'}
          {status === 'error' && (data.error || 'Failed')}
        </div>
      </div>
      <div className="pc-right">
        {ACTIVE.has(status) && <div className="spinner" />}
        {status === 'done' && <IconCheck width={20} height={20} style={{ color: 'var(--success)' }} />}
        {status === 'error' && <IconAlert width={20} height={20} style={{ color: 'var(--danger)' }} />}
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
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = '') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  const fetchJob = useCallback(async () => {
    try { setJob(await api.getJob(jobId)) } catch {}
  }, [jobId])

  useEffect(() => { setJob(null); fetchJob() }, [jobId, fetchJob])

  // Poll only while generating; stop when settled.
  useEffect(() => {
    if (!job || !ACTIVE.has(job.status)) { if (job) onJobUpdated?.(); return }
    const t = setInterval(fetchJob, 2000)
    return () => clearInterval(t)
  }, [job, fetchJob, onJobUpdated])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.exportPdf(jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `AudiobookPrep_${job.title || jobId}.pdf`; a.click()
      URL.revokeObjectURL(url)
      showToast('PDF exported', 'success'); fetchJob()
    } catch (e) { showToast(e.message, 'error') } finally { setExporting(false) }
  }

  const handleSaveToCorpus = async () => {
    const genre = prompt('Genre (fiction, thriller, literary, nonfiction):', 'fiction')
    if (genre === null) return
    setSaving(true)
    try { await api.saveToCorpus(jobId, genre); showToast('Saved to Style Library', 'success') }
    catch (e) { showToast(e.message, 'error') } finally { setSaving(false) }
  }

  const handleRegenerate = async (key, instructions) => {
    await api.regenerateSection(jobId, key, instructions)
    const poll = setInterval(async () => {
      const u = await api.getJob(jobId); setJob(u)
      if (u.sections[key]?.status !== 'generating' && u.sections[key]?.status !== 'pending') clearInterval(poll)
    }, 2000)
  }

  if (!job) return <SkeletonPage />

  const isGenerating = ACTIVE.has(job.status)
  const sections = job.sections || {}
  const erroredSections = ORDER.filter(k => sections[k]?.status === 'error')

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-titles">
          <h1 className="h-section">{job.title || 'Untitled'}</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {job.author && <span>by {job.author}</span>}
            {job.author && <span>·</span>}
            <span>{job.word_count?.toLocaleString()} words</span>
            {job.page_count ? <><span>·</span><span>{job.page_count} pages</span></> : null}
          </div>
        </div>
        {!isGenerating && (
          <div className="toolbar-actions">
            <button className="btn btn-ghost" onClick={handleSaveToCorpus} disabled={saving}>
              <IconLibrary width={16} height={16} />{saving ? 'Saving…' : 'Save to Library'}
            </button>
            <button className="btn btn-accent" onClick={handleExport} disabled={exporting}>
              <IconDownload width={16} height={16} />{exporting ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        )}
      </div>

      {isGenerating && (
        <div>
          <div className="text-sub" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IconClock width={16} height={16} /> Generating all sections in parallel…
          </div>
          <div className="stack">
            {ORDER.map(k => <ProgressCard key={k} sectionKey={k} data={sections[k] || { status: 'pending' }} />)}
          </div>
        </div>
      )}

      {!isGenerating && (
        <div>
          {erroredSections.length > 0 && (
            <div className="error-banner" style={{ marginBottom: 20 }}>
              <IconAlert className="eb-icon" />
              <div>
                <div className="eb-title">{erroredSections.length} section{erroredSections.length > 1 ? 's' : ''} couldn’t be generated</div>
                <div className="eb-msg">{sections[erroredSections[0]]?.error || 'Unknown error.'} Fix the issue, then use Regenerate on each affected section.</div>
              </div>
            </div>
          )}

          <div className="section-nav">
            {ORDER.map(k => {
              const Icon = SECTION_ICONS[k]
              const st = sections[k]?.status
              return (
                <button key={k} className={`nav-pill ${active === k ? 'active' : ''}`} onClick={() => setActive(k)}>
                  <Icon /> {META[k].title}
                  {st === 'error' && <span className="pill-dot status-error" />}
                  {ACTIVE.has(st) && <span className="pill-dot status-generating" />}
                </button>
              )
            })}
          </div>

          {ORDER.map(k => active === k && (
            <SectionEditor key={k} sectionKey={k} meta={META[k]}
              content={sections[k]?.content || ''} status={sections[k]?.status}
              error={sections[k]?.error}
              onSave={c => api.saveSection(jobId, k, c)}
              onRegenerate={ins => handleRegenerate(k, ins)} />
          ))}
        </div>
      )}

      {job.status === 'error' && (
        <div className="error-banner">
          <IconAlert className="eb-icon" />
          <div><div className="eb-title">Generation failed</div><div className="eb-msg">{job.error}</div></div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <IconCheck width={16} height={16} />} {toast.msg}
        </div>
      )}
    </div>
  )
}

function SkeletonPage() {
  return (
    <div>
      <div className="skeleton skel-line w-40" style={{ height: 26, marginBottom: 8 }} />
      <div className="skeleton skel-line w-60" style={{ height: 14, marginBottom: 28 }} />
      <div className="stack">
        {[0,1,2,3,4].map(i => (
          <div className="card progress-card" key={i}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
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
