import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Shared hosting sering memblokir method PUT/PATCH/DELETE (mod_security/LiteSpeed).
  // Kirim sebagai POST + header override; middleware MethodOverride di backend mengembalikannya.
  const method = (config.method || '').toLowerCase()
  if (['put', 'patch', 'delete'].includes(method)) {
    config.headers['X-HTTP-Method-Override'] = method.toUpperCase()
    config.method = 'post'
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Request boot validasi (/auth/me saat aplikasi dimulai) menangani 401-nya
    // sendiri (hapus sesi + state), jadi tidak perlu redirect paksa di sini.
    const skipRedirect = err.config?.skipAuthRedirect
    if (err.response?.status === 401 && !skipRedirect) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (err.response?.status === 403) {
      toast.error('Anda tidak memiliki izin untuk aksi ini.')
    } else if (err.response?.status === 500) {
      toast.error('Terjadi kesalahan server. Coba lagi nanti.')
    }
    return Promise.reject(err)
  }
)

export default api

// Resolusi URL berkas (asset/storage) agar selalu mengarah ke origin backend,
// baik saat pengembangan lokal (backend:8000) maupun saat diakses via proxy.
export function storageUrl(url) {
  if (!url) return url
  if (url.startsWith('/storage')) return `${API_ORIGIN}${url}`
  try {
    const u = new URL(url)
    return u.origin === API_ORIGIN ? u.toString() : `${API_ORIGIN}${u.pathname}${u.search}`
  } catch {
    return url
  }
}
