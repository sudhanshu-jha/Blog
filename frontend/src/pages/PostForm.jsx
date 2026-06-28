import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'

export default function PostForm({ postId, navigate }) {
  const { user } = useAuth()
  const isEdit = Boolean(postId)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      api.get(`/posts/${postId}/`).then(p => { setTitle(p.title); setText(p.text) })
    }
  }, [postId, isEdit])

  if (!user) { navigate('login'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.put(`/posts/${postId}/`, { title, text })
        navigate('detail', postId)
      } else {
        const post = await api.post('/posts/', { title, text, author: 1 })
        navigate('detail', post.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="form-card">
        <h1>{isEdit ? 'Edit Post' : 'New Post'}</h1>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Post title…" />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea value={text} onChange={e => setText(e.target.value)} required placeholder="Write your post…" style={{ minHeight: 280 }} />
          </div>
          <div className="form-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Post'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('list')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
