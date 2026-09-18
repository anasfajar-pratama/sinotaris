import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { LayoutDashboard, FileText, Bell, User, LogOut, FileCheck } from 'lucide-react'

export default function ClientLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <nav className="bg-primary-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FileCheck size={18} />
              </div>
              <span className="font-bold text-lg">SiNotaris</span>
              <span className="text-primary-200 text-sm">— Portal Klien</span>
            </div>
            <div className="flex items-center gap-6">
              <NavLink
                to="/client/dashboard"
                className={({ isActive }) => `flex items-center gap-1.5 text-sm py-1 border-b-2 transition-colors ${isActive ? 'border-white text-white' : 'border-transparent text-primary-200 hover:text-white'}`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
              <NavLink
                to="/client/documents"
                className={({ isActive }) => `flex items-center gap-1.5 text-sm py-1 border-b-2 transition-colors ${isActive ? 'border-white text-white' : 'border-transparent text-primary-200 hover:text-white'}`}
              >
                <FileText size={16} />
                Dokumen Saya
              </NavLink>
              <NavLink
                to="/client/notifications"
                className={({ isActive }) => `flex items-center gap-1.5 text-sm py-1 border-b-2 transition-colors ${isActive ? 'border-white text-white' : 'border-transparent text-primary-200 hover:text-white'}`}
              >
                <Bell size={16} />
                Notifikasi
              </NavLink>
              <NavLink
                to="/client/profile"
                className={({ isActive }) => `flex items-center gap-1.5 text-sm py-1 border-b-2 transition-colors ${isActive ? 'border-white text-white' : 'border-transparent text-primary-200 hover:text-white'}`}
              >
                <User size={16} />
                Profil
              </NavLink>
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-primary-600">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm text-primary-100">{user?.name}</span>
                <button onClick={handleLogout} className="text-primary-200 hover:text-white transition-colors ml-1">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
