import { create } from 'zustand'
import api from '../services/api'

const user = JSON.parse(localStorage.getItem('user') || 'null')

const useAuthStore = create((set, get) => ({
  user,
  token: localStorage.getItem('token') || null,
  permissions: user?.permissions ?? [],
  loading: false,
  initiallyChecking: true,

  initAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ initiallyChecking: false })
      return
    }
    try {
      const res = await api.get('/auth/me', { skipAuthRedirect: true })
      const freshUser = res.data.user
      localStorage.setItem('user', JSON.stringify(freshUser))
      set({ token, user: freshUser, permissions: freshUser.permissions ?? [], initiallyChecking: false })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null, permissions: [], initiallyChecking: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ token, user, permissions: user.permissions ?? [], loading: false })
      return { success: true, user }
    } catch (err) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message || 'Login gagal' }
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null, permissions: [] })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, permissions: user.permissions ?? [] })
  },

  isAdmin: () => {
    const { user } = get()
    return user && ['super-admin', 'notaris', 'staff'].includes(user.role)
  },

  isNotaris: () => {
    const { user } = get()
    return user && ['super-admin', 'notaris'].includes(user.role)
  },

  isClient: () => {
    const { user } = get()
    return user && user.role === 'klien'
  },

  hasPermission: (permission) => {
    const { user, permissions } = get()
    if (!user) return false
    if (user.role === 'super-admin') return true
    return permissions.includes(permission)
  },

  hasAnyPermission: (permissions) => {
    const { user } = get()
    if (!user) return false
    if (user.role === 'super-admin') return true
    const perms = get().permissions
    return (permissions ?? []).some((p) => perms.includes(p))
  },
}))

export default useAuthStore
