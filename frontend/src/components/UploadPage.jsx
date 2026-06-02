import { useState, useRef } from 'react'
import { api } from '../api/client'

export default function UploadPage({ onJobCreated }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const handleFile = f => {
    if (!f || !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file')
      return
    }
    setFile(f)
    setError('')
    // Pre-fill title from filename
    if (!title) {
      const name = f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
      setTitle(name)
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) { setError('Please select a PDF first'); return }
    setLoading(true)
    setError('')
    try {
      const job = await api.createJob(file, title, author)
      onJobCreated(job.job_id)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">New Narrator Guide</h1>
      <p className="page-subtitle">Upload a manuscript PDF to begin generation.</p>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="upload-icon">{file ? '📄' : '⬆️'}</div>
        <div className="upload-title">
          {file ? file.name : 'Drop manuscript PDF here'}
        </div>
        <div className="upload-subtitle">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB · click to change`
            : 'or click to browse'}
        </div>

        {file && (
          <div className="upload-fields" onClick={e => e.stopPropagation()}>
            <div className="upload-field">
              <label>Book Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. The Name of the Wind"
              />
            </div>
            <div className="upload-field">
              <label>Author</label>
              <input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="e.g. Patrick Rothfuss"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: 13 }}>{error}</p>}

      {file && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Uploading…' : '✨ Generate Guide'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setFile(null); setTitle(''); setAuthor('') }}>
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
