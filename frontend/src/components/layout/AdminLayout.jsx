import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../stores/authStore'
import {
  LayoutDashboard, FileText, GitBranch, Users, BarChart2,
    Bell, Settings, LogOut, Menu, X, ChevronDown, FileCheck, ShieldCheck, Layers
} from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/documents',     icon: FileText,         label: 'Order',        permission: 'documents.view' },
  { to: '/admin/clients',       icon: Users,            label: 'Klien',         permission: 'clients.view' },
  { to: '/admin/reports',       icon: BarChart2,        label: 'Laporan',       permission: 'reports.view' },
  { to: '/admin/notifications', icon: Bell,             label: 'Notifikasi' },
  { to: '/admin/users',         icon: Users,            label: 'Pengguna',      permission: 'users.view' },
  { to: '/admin/settings',      icon: Settings,         label: 'Pengaturan',    permission: 'settings.view' },
  { to: '/admin/order-mapping', icon: Layers,           label: 'Mapping Order', permission: 'settings.edit' },
  { to: '/admin/rbac',          icon: ShieldCheck,      label: 'RBAC',          permission: 'rbac.manage' },
]

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filteredNav = navItems.filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-sidebar-bg transition-all duration-300 flex flex-col flex-shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileCheck size={18} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-white font-bold text-sm">SiNotaris</p>
                <p className="text-slate-400 text-xs">Sistem Notaris</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all text-sm
                ${isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <NavLink to="/admin/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-600" />
            </NavLink>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) ?? 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
