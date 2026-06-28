import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function fmt(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PostDetail({ postId, navigate }) {
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/posts/${postId}/`),
      api.get(`/posts/${postId}/comments/`),
    ]).then(([p, c]) => { setPost(p); setComments(c) })
      .finally(() => setLoading(false))
  }, [postId])

  const handlePublish = async () => {
    const updated = await api.post(`/posts/${postId}/publish/`, {})
    setPost(updated)
  }

  const handleApprove = async (commentId) => {
    const updated = await api.post(`/comments/${commentId}/approve/`, {})
    setComments(cs => cs.map(c => c.id === commentId ? updated : c))
  }

  const handleRemoveComment = async (commentId) => {
    await api.delete(`/comments/${commentId}/`)
    setComments(cs => cs.filter(c => c.id !== commentId))
  }

  if (loading) return <div className="spinner">Loading…</div>
  if (!post) return <div className="page-wrap"><p>Post not found.</p></div>

  const approvedCount = comments.filter(c => c.approved_comment).length

  return (
    <div className="page-wrap">
      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          {post.published_date ? (
            <span>{fmt(post.published_date)}</span>
          ) : (
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Draft</span>
          )}
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>{approvedCount} comment{approvedCount !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.text }} />

      <div className="post-actions">
        {!post.published_date && user && (
          <button className="btn btn-primary" onClick={handlePublish}>Publish</button>
        )}
        {user && (
          <>
            <button className="btn btn-outline" onClick={() => navigate('edit', post.id)}>✏ Edit</button>
            <button className="btn btn-ghost" onClick={() => navigate('delete', post.id)}>Delete</button>
          </>
        )}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => navigate('comment', post.id)}>
          + Comment
        </button>
      </div>

      <section className="comments-section">
        <h3 className="comments-title">Comments</h3>

        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => {
            if (!user && !comment.approved_comment) return null
            return (
              <div key={comment.id} className={`comment${!comment.approved_comment ? ' comment--pending' : ''}`}>
                <div className="comment__header">
                  <span className="comment__author">{comment.author}</span>
                  <span className="comment__date">{fmt(comment.created_date)}</span>
                  {!comment.approved_comment && (
                    <>
                      <span className="comment__pending-badge">Pending</span>
                      <div className="comment__actions">
                        <button className="btn btn-sm btn-outline" onClick={() => handleApprove(comment.id)}>✓ Approve</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleRemoveComment(comment.id)}>✕</button>
                      </div>
                    </>
                  )}
                </div>
                <div className="comment__body">{comment.text}</div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
