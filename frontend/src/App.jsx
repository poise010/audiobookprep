import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { api } from './api/client'
import UploadPage from './components/UploadPage'
import JobPage from './components/JobPage'
import LibraryPage from './components/LibraryPage'

function Sidebar({ jobs, activeJobId, onNewJob }) {
  const navigate = useNavigate()
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        AudiobookPrep
        <span>Guide Generator</span>
      </div>
      <button className="sidebar-new-btn" onClick={onNewJob}>+ New Guide</button>
      <div className="sidebar-section">Recent</div>
      <div className="job-list">
        {jobs.map(job => (
          <div
            key={job.id}
            className={`job-item ${job.id === activeJobId ? 'active' : ''}`}
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            <div className="job-item-title">{job.title || 'Untitled'}</div>
            <div className="job-item-meta">
              <span className={`job-item-status status-${job.status}`} />
              {job.status} · {job.word_count?.toLocaleString()} words
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 20px 24px' }}>
        <div
          className="job-item"
          style={{ borderRadius: 6, cursor: 'pointer' }}
          onClick={() => navigate('/library')}
        >
          <div className="job-item-title" style={{ fontSize: 13 }}>📚 Style Library</div>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const [jobs, setJobs] = useState([])
  const navigate = useNavigate()

  const refreshJobs = useCallback(async () => {
    try {
      const data = await api.getJobs()
      setJobs(data)
    } catch (e) {
      // silently ignore on startup if backend isn't ready yet
    }
  }, [])

  useEffect(() => {
    refreshJobs()
    const interval = setInterval(refreshJobs, 3000)
    return () => clearInterval(interval)
  }, [refreshJobs])

  const handleNewJob = () => navigate('/')

  const activeJobId = useParams()?.jobId

  return (
    <div className="app-shell">
      <Sidebar jobs={jobs} activeJobId={activeJobId} onNewJob={handleNewJob} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<UploadPage onJobCreated={id => { refreshJobs(); navigate(`/jobs/${id}`) }} />} />
          <Route path="/jobs/:jobId" element={<JobPage onJobUpdated={refreshJobs} />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </main>
    </div>
  )
}
