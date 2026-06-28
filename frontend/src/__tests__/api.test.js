import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'

function setDocumentCookie(value) {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value,
  })
}

describe('api', () => {
  beforeEach(() => {
    setDocumentCookie('')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET request', () => {
    it('calls fetch with correct method and path', async () => {
      fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ data: 1 }) })
      await api.get('/posts/')
      expect(fetch).toHaveBeenCalledWith(
        '/api/posts/',
        expect.objectContaining({ method: 'GET', credentials: 'include' }),
      )
    })

    it('returns parsed JSON on success', async () => {
      fetch.mockResolvedValue({ status: 200, ok: true, json: async () => [{ id: 1 }] })
      const result = await api.get('/posts/')
      expect(result).toEqual([{ id: 1 }])
    })

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ detail: 'Forbidden' }),
      })
      await expect(api.get('/posts/drafts/')).rejects.toThrow('Forbidden')
    })

    it('throws generic message when detail missing', async () => {
      fetch.mockResolvedValue({ status: 500, ok: false, json: async () => ({}) })
      await expect(api.get('/posts/')).rejects.toThrow('HTTP 500')
    })
  })

  describe('POST request', () => {
    it('sends body as JSON', async () => {
      fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({ id: 2 }) })
      await api.post('/posts/', { title: 'T', text: 'B' })
      const [, init] = fetch.mock.calls[0]
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({ title: 'T', text: 'B' })
    })

    it('returns null on 204', async () => {
      fetch.mockResolvedValue({ status: 204, ok: true, json: async () => null })
      const result = await api.post('/auth/logout/', {})
      expect(result).toBeNull()
    })
  })

  describe('PUT request', () => {
    it('sends PUT method', async () => {
      fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ id: 1 }) })
      await api.put('/posts/1/', { title: 'Updated' })
      const [, init] = fetch.mock.calls[0]
      expect(init.method).toBe('PUT')
    })
  })

  describe('DELETE request', () => {
    it('sends DELETE with no body', async () => {
      fetch.mockResolvedValue({ status: 204, ok: true, json: async () => null })
      const result = await api.delete('/posts/1/')
      const [, init] = fetch.mock.calls[0]
      expect(init.method).toBe('DELETE')
      expect(init.body).toBeUndefined()
      expect(result).toBeNull()
    })
  })

  describe('CSRF token', () => {
    it('sends X-CSRFToken header when cookie present', async () => {
      setDocumentCookie('csrftoken=abc123')
      fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) })
      await api.get('/posts/')
      const [, init] = fetch.mock.calls[0]
      expect(init.headers['X-CSRFToken']).toBe('abc123')
    })

    it('omits X-CSRFToken header when cookie absent', async () => {
      setDocumentCookie('')
      fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) })
      await api.get('/posts/')
      const [, init] = fetch.mock.calls[0]
      expect(init.headers['X-CSRFToken']).toBeUndefined()
    })
  })
})
