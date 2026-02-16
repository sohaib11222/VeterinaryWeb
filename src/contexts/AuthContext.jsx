import { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext()

const normalizeUser = (u) => {
  if (!u) return null
  const id = u.id || u._id
  return id ? { ...u, id } : u
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (token) {
      const storedUser = authApi.getUserFromStorage()
      if (storedUser) {
        setUser(normalizeUser(storedUser))
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }

  const login = async (email, password, userType = 'patient') => {
    try {
      const payload = await authApi.login(email, password, userType)
      const data = payload?.data ?? payload
      if (data?.token) {
        localStorage.setItem('token', data.token)
      }
      if (data?.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      if (data?.user) {
        const normalized = normalizeUser(data.user)
        localStorage.setItem('user', JSON.stringify(normalized))
        setUser(normalized)
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const register = async (payload, userType = 'patient') => {
    try {
      const outer = await authApi.register(payload, userType)
      const data = outer?.data ?? outer
      if (data?.token) {
        localStorage.setItem('token', data.token)
      }
      if (data?.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      if (data?.user) {
        const normalized = normalizeUser(data.user)
        localStorage.setItem('user', JSON.stringify(normalized))
        setUser(normalized)
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const updateUser = (partialUser) => {
    const currentRaw = authApi.getUserFromStorage()
    const current = normalizeUser(currentRaw)
    const merged = normalizeUser({ ...(current || {}), ...(partialUser || {}) })
    if (merged) {
      localStorage.setItem('user', JSON.stringify(merged))
    }
    setUser(merged)
    return merged
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

