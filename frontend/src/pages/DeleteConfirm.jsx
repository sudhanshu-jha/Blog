import { useEffect, useState } from 'react'
import { api } from '../api'

export default function DeleteConfirm({ postId, navigate }) {
  const [post, setPost] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get(`/posts/${postId}/`).then(setPost)
  }, [postId])

  const handleDelete = async () => {
    setDeleting(true)
    await api.delete(`/posts/${postId}/`)
    navigate('list')
  }

  return (
    <div className="confirm-wrap">
      <div className="confirm-card">
        <h2>Delete post?</h2>
        <p>"{post?.title}" will be permanently removed and cannot be recovered.</p>
        <div className="actions">
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('detail', postId)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
