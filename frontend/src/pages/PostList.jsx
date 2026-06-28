import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function fmt(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PostList({ navigate }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/posts/').then(setPosts).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner">Loading…</div>

  return (
    <div className="page-wrap">
      <h1 className="page-title">Latest Posts</h1>

      {posts.length === 0 ? (
        <div className="empty-state">
          <h2>No posts yet</h2>
          <p>{user ? 'Start writing your first post.' : 'Check back soon.'}</p>
          {user && (
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('new')}>
              + New Post
            </button>
          )}
        </div>
      ) : (
        <div className="post-feed">
          {posts.map(post => (
            <article key={post.id} className="post-card">
              <div className="post-card__meta">{fmt(post.published_date)}</div>
              <h2 className="post-card__title">
                <button onClick={() => navigate('detail', post.id)}>{post.title}</button>
              </h2>
              <div className="post-card__footer">
                <button onClick={() => navigate('detail', post.id)}>
                  {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
                </button>
                <span>·</span>
                <button onClick={() => navigate('detail', post.id)}>Read →</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
