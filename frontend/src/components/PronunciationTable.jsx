import { Fragment } from 'react'

const CAT_LABELS = {
  character_name: 'Character Names',
  place: 'Place Names',
  organization: 'Organizations',
  foreign: 'Foreign & Invented Words',
  unusual: 'Unusual English Words',
}

const CAT_ORDER = ['character_name', 'place', 'organization', 'foreign', 'unusual']

export default function PronunciationTable({ entries }) {
  if (!entries || entries.length === 0) return null

  const byCategory = {}
  const unverified = []

  for (const entry of entries) {
    if (!entry.verified) {
      unverified.push(entry)
    } else {
      const cat = entry.category || 'unusual'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(entry)
    }
  }

  const hasVerified = CAT_ORDER.some(c => byCategory[c]?.length > 0)

  return (
    <div className="pron-table-wrap">
      {CAT_ORDER.map(cat => {
        const items = byCategory[cat]
        if (!items || items.length === 0) return null
        return (
          <div key={cat} className="pron-group">
            <div className="pron-group-label">{CAT_LABELS[cat] || cat}</div>
            <table className="pron-table">
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Pronunciation</th>
                  <th>Sounds Like</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e, i) => (
                  <Fragment key={i}>
                    <tr>
                      <td><strong>{e.word}</strong></td>
                      <td>{e.phonetic || '—'}</td>
                      <td>{e.rhymes_with || '—'}</td>
                      <td className="pron-source-cell">{e.source || '—'}</td>
                    </tr>
                    {e.notes && (
                      <tr>
                        <td colSpan={4} className="pron-note-cell">{e.notes}</td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {unverified.length > 0 && (
        <div className="pron-group pron-group--unverified">
          <div className="pron-group-label">Needs Research Before Recording</div>
          <p className="pron-unverified-note">
            No verified pronunciation on file for these words. Confirm with the author
            or a dialect coach before the session begins.
          </p>
          <table className="pron-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Type</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {unverified.map((e, i) => (
                <tr key={i}>
                  <td><strong>{e.word}</strong></td>
                  <td>{CAT_LABELS[e.category] || e.category || '—'}</td>
                  <td className="pron-context-cell">{e.context || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
