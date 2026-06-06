import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from './api/client'
import UploadPage from './components/UploadPage'
import JobPage from './components/JobPage'
import LibraryPage from './components/LibraryPage'
import { IconPlus, IconLibrary } from './components/icons'

const ACTIVE = new Set(['pending', 'generating'])

function Sidebar({ jobs, onNewJob }) {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const { pathname } = useLocation()
  return (
    <nav className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <div className="sidebar-logo-mark">Audiobook<b>Prep</b></div>
        <div className="sidebar-logo-sub">Guide Generator</div>
      </div>
      <button className="sidebar-new-btn" onClick={onNewJob}>
        <IconPlus width={16} height={16} /><span>New Guide</span>
      </button>
      <div className="sidebar-label">Recent</div>
      <div className="job-list">
        {jobs.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--sidebar-muted)' }}>No guides yet</div>
        )}
        {jobs.map(job => (
          <div key={job.id}
            className={`job-item ${job.id === jobId ? 'active' : ''}`}
            onClick={() => navigate(`/jobs/${job.id}`)}>
            <div className="job-item-title">{job.title || 'Untitled'}</div>
            <div className="job-item-meta">
              <span className={`dot status-${job.status}`} />
              {job.status} · {job.word_count?.toLocaleString()} words
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className={`job-item ${pathname === '/library' ? 'active' : ''}`} onClick={() => navigate('/library')}>
          <div className="job-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconLibrary width={15} height={15} /> Style Library
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const [jobs, setJobs] = useState([])
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const refreshJobs = useCallback(async () => {
    try { setJobs(await api.getJobs()) } catch {}
  }, [])

  // Smart polling: only poll while a job is active AND the tab is visible.
  // Stops entirely once everything is ready — no infinite request spam.
  useEffect(() => {
    refreshJobs()
    const tick = () => {
      if (document.hidden) return
      const anyActive = jobs.some(j => ACTIVE.has(j.status))
      if (anyActive) refreshJobs()
    }
    const anyActive = jobs.some(j => ACTIVE.has(j.status))
    if (anyActive) {
      timerRef.current = setInterval(tick, 2500)
      return () => clearInterval(timerRef.current)
    }
  }, [jobs, refreshJobs])

  const handleNewJob = () => navigate('/')

  return (
    <div className="app-shell">
      <Sidebar jobs={jobs} onNewJob={handleNewJob} />
      <main className="main-content">
        <div className="main-inner">
          <Routes>
            <Route path="/" element={<UploadPage onJobCreated={id => { refreshJobs(); navigate(`/jobs/${id}`) }} />} />
            <Route path="/jobs/:jobId" element={<JobPage onJobUpdated={refreshJobs} />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
