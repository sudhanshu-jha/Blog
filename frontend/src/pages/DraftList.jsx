import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function fmt(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DraftList({ navigate }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('login'); return }
    api.get('/posts/drafts/').then(setPosts).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="spinner">Loading…</div>

  return (
    <div className="page-wrap">
      <h1 className="page-title">Drafts</h1>
      {posts.length === 0 ? (
        <div className="empty-state">
          <h2>No drafts</h2>
          <p>You don't have any unpublished posts.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('new')}>
            + New Post
          </button>
        </div>
      ) : (
        <div className="post-feed">
          {posts.map(post => (
            <article key={post.id} className="post-card">
              <div className="post-card__meta">
                Created {fmt(post.created_date)}
                <span className="draft-badge">Draft</span>
              </div>
              <h2 className="post-card__title">
                <button onClick={() => navigate('detail', post.id)}>{post.title}</button>
              </h2>
              <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', margin: '.4rem 0 .75rem', lineHeight: 1.5 }}>
                {post.text.slice(0, 180)}{post.text.length > 180 ? '…' : ''}
              </p>
              <div className="post-card__footer">
                <button className="btn btn-sm btn-outline" onClick={() => navigate('detail', post.id)}>View</button>
                <button className="btn btn-sm btn-primary" onClick={() => navigate('edit', post.id)}>Edit</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
