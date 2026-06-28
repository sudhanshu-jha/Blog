function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const csrf = getCookie('csrftoken')
  if (csrf) headers['X-CSRFToken'] = csrf

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
}
