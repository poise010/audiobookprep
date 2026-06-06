import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from './api/client'
import UploadPage from './components/UploadPage'
import JobPage from './components/JobPage'
import { IconPlus } from './components/icons'

const ACTIVE = new Set(['pending', 'generating'])

function Sidebar({ jobs, onNewJob }) {
  const navigate = useNavigate()
  const { jobId } = useParams()

  return (
    <nav className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <div className="sidebar-logo-eq" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-mark">Audiobook<b>Prep</b></div>
          <div className="sidebar-logo-sub">Narrator Studio</div>
        </div>
      </div>

      <button className="sidebar-new-btn" onClick={onNewJob}>
        <IconPlus width={16} height={16} /><span>New Guide</span>
      </button>

      <div className="sidebar-label">Recent</div>

      <div className="job-list">
        {jobs.length === 0 && (
          <div className="job-list-empty">No guides yet</div>
        )}
        {jobs.map((job, i) => (
          <div
            key={job.id}
            className={`job-item ${job.id === jobId ? 'active' : ''}`}
            style={{ animationDelay: `${0.14 + i * 0.04}s` }}
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            <div className="job-item-title">{job.title || 'Untitled'}</div>
            <div className="job-item-meta">
              <span className={`dot status-${job.status}`} />
              {job.status === 'ready' || job.status === 'exported' ? 'Ready' : job.status}
              {job.word_count ? ` · ${job.word_count.toLocaleString()} words` : ''}
            </div>
          </div>
        ))}
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
          </Routes>
        </div>
      </main>
    </div>
  )
}
