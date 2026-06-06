const BASE = '/api'

async function request(method, path, body, isFormData = false) {
  const opts = { method, headers: {} }
  if (body) {
    if (isFormData) {
      opts.body = body
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
  }
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res
}

export const api = {
  async createJob(file, title, author) {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title || '')
    form.append('author', author || '')
    const res = await request('POST', '/jobs', form, true)
    return res.json()
  },

  async getJobs() {
    const res = await request('GET', '/jobs')
    return res.json()
  },

  async getJob(jobId) {
    const res = await request('GET', `/jobs/${jobId}`)
    return res.json()
  },

  async exportPdf(jobId) {
    const res = await request('POST', `/jobs/${jobId}/export`)
    return res.blob()
  },
}
