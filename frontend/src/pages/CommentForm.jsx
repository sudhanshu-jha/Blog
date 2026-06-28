import { useState } from 'react'
import { api } from '../api'

export default function CommentForm({ postId, navigate }) {
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post(`/posts/${postId}/comments/`, { author, text })
      navigate('detail', postId)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="form-card">
        <h1>Add a Comment</h1>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your name</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} required placeholder="Name…" />
          </div>
          <div className="form-group">
            <label>Comment</label>
            <textarea value={text} onChange={e => setText(e.target.value)} required placeholder="Write a comment…" />
          </div>
          <div className="form-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Posting…' : 'Post Comment'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('detail', postId)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
