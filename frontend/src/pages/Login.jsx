import { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function Login({ navigate }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('list')
    } catch {
      setError('Username or password didn\'t match. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="site-wordmark">My Tech Blog</div>
        <div className="form-card">
          <h1>Log in</h1>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input id="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.75rem' }} disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
