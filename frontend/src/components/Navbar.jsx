import { useAuth } from '../AuthContext'

export default function Navbar({ navigate }) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('list')
  }

  return (
    <nav className="site-nav">
      <span className="nav-brand" onClick={() => navigate('list')}>My Tech Blog</span>

      <ul className="nav-links">
        <li><button onClick={() => navigate('about')}>About</button></li>
        <li><button onClick={() => window.open('https://www.github.com', '_blank')}>GitHub</button></li>
        <li><button onClick={() => window.open('https://www.linkedin.com', '_blank')}>LinkedIn</button></li>
      </ul>

      <ul className="nav-right">
        {user ? (
          <>
            <li><button className="btn-nav" onClick={() => navigate('new')}>+ New Post</button></li>
            <li><button onClick={() => navigate('drafts')}>Drafts</button></li>
            <li className="nav-greeting">{user.username}</li>
            <li><button onClick={handleLogout}>Log out</button></li>
          </>
        ) : (
          <li><button onClick={() => navigate('login')}>Log in</button></li>
        )}
      </ul>
    </nav>
  )
}
