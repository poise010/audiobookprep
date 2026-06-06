import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { IconBook, IconLibrary, IconTrash, IconCheck } from './icons'

export default function LibraryPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = '') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600) }

  const load = async () => {
    setLoading(true)
    try { setEntries(await api.getLibrary()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!confirm(`Remove “${title}” as a style reference? This does not delete the guide itself.`)) return
    try { await api.deleteFromLibrary(id); showToast('Removed from library'); load() }
    catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div>
      <h1 className="h-page">Style Library</h1>
      <p className="text-sub" style={{ marginTop: 6, marginBottom: 32 }}>
        Completed guides saved here teach the generator your voice. The more you save, the closer each first draft lands.
      </p>

      {loading ? (
        <div className="lib-grid">
          {[0,1,2].map(i => (
            <div className="card lib-card" key={i}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skel-line w-40" style={{ margin: 0, marginBottom: 8 }} />
                <div className="skeleton skel-line w-60" style={{ margin: 0, height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><IconLibrary width={26} height={26} /></div>
          <div className="empty-title">No reference guides yet</div>
          <div className="empty-sub">Generate a guide, edit it to perfection, then click “Save to Library.” Future guides will start in your voice.</div>
        </div>
      ) : (
        <div className="lib-grid">
          {entries.map(e => (
            <div key={e.guide_id} className="card lib-card">
              <div className="lib-icon"><IconBook width={20} height={20} /></div>
              <div className="lib-body">
                <div className="lib-title">{e.book_title || 'Untitled'}</div>
                <div className="lib-meta">{e.author && `by ${e.author}`}{e.author && e.genre && ' · '}{e.genre}</div>
              </div>
              <button className="btn btn-danger-ghost btn-sm" onClick={() => handleDelete(e.guide_id, e.book_title)}>
                <IconTrash width={14} height={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' && <IconCheck width={16} height={16} />} {toast.msg}</div>}
    </div>
  )
}
