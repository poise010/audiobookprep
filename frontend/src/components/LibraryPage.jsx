import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function LibraryPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getLibrary()
      setEntries(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (guideId, title) => {
    if (!confirm(`Remove "${title}" from the style library? This won't delete the guide — just removes it as a style reference.`)) return
    try {
      await api.deleteFromLibrary(guideId)
      showToast('Removed from library', '')
      load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <div>
      <h1 className="page-title">Style Library</h1>
      <p className="page-subtitle">
        Completed guides saved here teach the AI your voice. The more guides you save, the better it gets.
      </p>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <div className="library-empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <p>No guides in the library yet.</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Generate and export a guide, then click "Save to Library" to start training your style.
          </p>
        </div>
      )}

      <div className="library-grid">
        {entries.map(entry => (
          <div key={entry.guide_id} className="library-card">
            <div style={{ fontSize: 28 }}>📖</div>
            <div className="library-card-body">
              <div className="library-card-title">{entry.book_title || 'Untitled'}</div>
              <div className="library-card-meta">
                {entry.author && `by ${entry.author} · `}
                {entry.genre && `${entry.genre}`}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => handleDelete(entry.guide_id, entry.book_title)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
