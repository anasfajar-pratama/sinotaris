import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'
import { FileCheck, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      toast.success(`Selamat datang, ${result.user.name}!`)
      if (['klien'].includes(result.user.role)) {
        navigate('/client/dashboard')
      } else {
        navigate('/admin/dashboard')
      }
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <FileCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">SiNotaris</h1>
          <p className="text-primary-200 mt-1">Sistem Informasi Manajemen Notaris</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Masuk ke Akun Anda</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3">Akun Demo:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded"><span>Notaris</span><span className="font-mono">notaris@sinotaris.id / password</span></div>
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded"><span>Staff</span><span className="font-mono">staff@sinotaris.id / password</span></div>
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded"><span>Admin</span><span className="font-mono">admin@sinotaris.id / password</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          © {new Date().getFullYear()} SiNotaris — Hak Cipta Dilindungi
        </p>
      </div>
    </div>
  )
}
