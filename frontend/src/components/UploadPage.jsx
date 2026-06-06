import { useState, useRef } from 'react'
import { api } from '../api/client'
import { IconUpload, IconFile, IconSparkle, IconAlert } from './icons'

export default function UploadPage({ onJobCreated }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const handleFile = f => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Please upload a PDF file.'); return }
    setFile(f); setError('')
    if (!title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
  }

  const handleDrop = e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const handleSubmit = async () => {
    if (!file) { setError('Please select a PDF first.'); return }
    setLoading(true); setError('')
    try {
      const job = await api.createJob(file, title, author)
      onJobCreated(job.job_id)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const clearFile = () => { setFile(null); setTitle(''); setAuthor(''); setError('') }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">New Preparation Guide</div>
        <h1 className="h-page">Brief the booth.</h1>
        <p className="text-sub">
          Drop in a manuscript and the studio writes all six sections in parallel —
          plot, characters, perspective, chapter notes, pronunciation, and items flagged for your discretion.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        <div className="upload-icon">{file ? <IconFile /> : <IconUpload />}</div>
        {file ? (
          <>
            <div className="upload-title upload-title--file">{file.name}</div>
            <div className="upload-sub">{(file.size / 1024 / 1024).toFixed(1)} MB · click to change</div>
          </>
        ) : (
          <>
            <div className="upload-title">Drop manuscript PDF here</div>
            <div className="upload-sub">or click to browse — PDF only</div>
          </>
        )}
      </div>

      {/* Metadata + actions — only shown after file selected */}
      {file && (
        <div className="upload-meta-card" style={{ animation: 'rise .4s cubic-bezier(.2,.7,.2,1) both' }}>
          <div className="upload-meta-fields">
            <div className="field">
              <label>Book Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="The Name of the Wind" />
            </div>
            <div className="field">
              <label>Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Patrick Rothfuss" />
            </div>
          </div>
          <div className="upload-actions">
            <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</>
                : <><IconSparkle width={16} height={16} /> Generate Guide</>}
            </button>
            <button className="btn btn-ghost" onClick={clearFile} disabled={loading}>Clear</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ marginTop: 16 }}>
          <IconAlert className="eb-icon" />
          <div><div className="eb-title">Couldn't upload</div><div className="eb-msg">{error}</div></div>
        </div>
      )}
    </div>
  )
}
