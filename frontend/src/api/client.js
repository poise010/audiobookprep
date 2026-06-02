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

  async saveSection(jobId, sectionKey, content) {
    const res = await request('PUT', `/jobs/${jobId}/sections/${sectionKey}`, { content })
    return res.json()
  },

  async regenerateSection(jobId, sectionKey, customInstructions = '') {
    const res = await request('POST', `/jobs/${jobId}/sections/${sectionKey}/regenerate`, {
      custom_instructions: customInstructions,
    })
    return res.json()
  },

  async exportPdf(jobId) {
    const res = await request('POST', `/jobs/${jobId}/export`)
    return res.blob()
  },

  async saveToCorpus(jobId, genre = 'fiction') {
    const res = await request('POST', `/jobs/${jobId}/save-to-corpus`, { genre })
    return res.json()
  },

  async getLibrary() {
    const res = await request('GET', '/library')
    return res.json()
  },

  async deleteFromLibrary(guideId) {
    const res = await request('DELETE', `/library/${guideId}`)
    return res.json()
  },
}
