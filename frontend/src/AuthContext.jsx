import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/user/')
      .then(data => setUser(data.is_authenticated ? data : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const data = await api.post('/auth/login/', { username, password })
    setUser(data)
    return data
  }

  const logout = async () => {
    await api.post('/auth/logout/', {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
