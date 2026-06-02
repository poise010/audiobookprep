import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import SectionEditor from './SectionEditor'

const SECTION_META = {
  plot_summary:       { label: 'Section 1', title: 'Plot Summary',             icon: '📖' },
  character_breakdown:{ label: 'Section 2', title: 'Character Breakdown',      icon: '🎭' },
  perspective_guide:  { label: 'Section 3', title: 'Perspective Guide',        icon: '👁' },
  chapter_summary:    { label: 'Section 4', title: 'Chapter-by-Chapter',       icon: '📋' },
  pronunciation_guide:{ label: 'Section 5', title: 'Pronunciation Guide',      icon: '🗣' },
}

function StatusCard({ sectionKey, sectionData }) {
  const meta = SECTION_META[sectionKey]
  const { status } = sectionData
  return (
    <div className="section-card">
      <div className="section-card-icon">{meta.icon}</div>
      <div className="section-card-body">
        <div className="section-card-name">{meta.title}</div>
        <div className="section-card-status">
          {status === 'done' ? `Complete · ${sectionData.content?.split(' ').length || 0} words` : status}
        </div>
      </div>
      <div>
        {status === 'generating' || status === 'pending' ? <div className="section-card-spinner" /> : null}
        {status === 'done' ? <span className="check-icon">✓</span> : null}
        {status === 'error' ? <span className="error-icon">✗</span> : null}
      </div>
    </div>
  )
}

export default function JobPage({ onJobUpdated }) {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [activeSection, setActiveSection] = useState('plot_summary')
  const [toast, setToast] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchJob = useCallback(async () => {
    try {
      const data = await api.getJob(jobId)
      setJob(data)
    } catch {}
  }, [jobId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Poll while generating
  useEffect(() => {
    if (!job || job.status === 'ready' || job.status === 'exported' || job.status === 'error') return
    const t = setInterval(fetchJob, 2000)
    return () => clearInterval(t)
  }, [job, fetchJob])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.exportPdf(jobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AudiobookPrep_${job.title || jobId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('PDF exported!', 'success')
      fetchJob()
      onJobUpdated()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleSaveToCorpus = async () => {
    const genre = prompt('Genre (e.g. fiction, thriller, literary, nonfiction):', 'fiction')
    if (genre === null) return
    setSaving(true)
    try {
      await api.saveToCorpus(jobId, genre)
      showToast('Saved to style library! Future guides will learn from this one.', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSectionSave = async (sectionKey, content) => {
    await api.saveSection(jobId, sectionKey, content)
  }

  const handleRegenerate = async (sectionKey, customInstructions) => {
    await api.regenerateSection(jobId, sectionKey, customInstructions)
    // Poll until done
    const poll = setInterval(async () => {
      const updated = await api.getJob(jobId)
      setJob(updated)
      if (updated.sections[sectionKey]?.status !== 'generating') {
        clearInterval(poll)
      }
    }, 2000)
  }

  if (!job) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>

  const isGenerating = job.status === 'generating' || job.status === 'pending'
  const isReady = job.status === 'ready' || job.status === 'exported'
  const sections = job.sections || {}

  return (
    <div>
      {/* Header */}
      <div className="editor-toolbar">
        <div>
          <div className="editor-toolbar-title">{job.title || 'Untitled'}</div>
          {job.author && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>by {job.author} · {job.word_count?.toLocaleString()} words</div>}
        </div>
        {isReady && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleSaveToCorpus} disabled={saving}>
              {saving ? 'Saving…' : '📚 Save to Library'}
            </button>
            <button className="btn btn-accent" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Generating PDF…' : '⬇ Export PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Progress view */}
      {isGenerating && (
        <div>
          <p className="page-subtitle">Generating all sections in parallel…</p>
          <div className="section-cards">
            {Object.entries(sections).map(([key, data]) => (
              <StatusCard key={key} sectionKey={key} sectionData={data} />
            ))}
          </div>
        </div>
      )}

      {/* Editor view */}
      {isReady && (
        <div>
          <div className="section-nav">
            {Object.entries(SECTION_META).map(([key, meta]) => (
              <button
                key={key}
                className={`section-nav-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                {meta.icon} {meta.title}
              </button>
            ))}
          </div>

          {Object.entries(SECTION_META).map(([key, meta]) => (
            activeSection === key && (
              <SectionEditor
                key={key}
                sectionKey={key}
                meta={meta}
                content={sections[key]?.content || ''}
                status={sections[key]?.status}
                onSave={content => handleSectionSave(key, content)}
                onRegenerate={instructions => handleRegenerate(key, instructions)}
              />
            )
          ))}
        </div>
      )}

      {job.status === 'error' && (
        <div style={{ color: 'var(--danger)', background: '#fff0f0', padding: 20, borderRadius: 8 }}>
          <strong>Generation failed:</strong> {job.error}
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
