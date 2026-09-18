import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './stores/authStore'

import LoginPage from './pages/LoginPage'
import AdminLayout from './components/layout/AdminLayout'
import ClientLayout from './components/layout/ClientLayout'

import AdminDashboard from './pages/admin/Dashboard'
import AdminDocuments from './pages/admin/Documents'
import AdminDocumentDetail from './pages/admin/DocumentDetail'
import AdminDocumentCreate from './pages/admin/DocumentCreate'
import AdminAjbDetail from './pages/admin/AjbDetail'
import AdminClients from './pages/admin/Clients'
import AdminClientDetail from './pages/admin/ClientDetail'
import AdminReports from './pages/admin/Reports'
import AdminNotifications from './pages/admin/Notifications'
import AdminUsers from './pages/admin/Users'
import AdminSettings from './pages/admin/Settings'
import AdminRbac from './pages/admin/Rbac'
import AdminOrderMapping from './pages/admin/OrderMapping'

import ClientDashboard from './pages/client/Dashboard'
import ClientDocuments from './pages/client/Documents'
import ClientDocumentDetail from './pages/client/DocumentDetail'
import ClientNotifications from './pages/client/Notifications'
import ClientProfile from './pages/client/Profile'

import PublicHome from './pages/public/Home'
import PublicTrack from './pages/public/Track'

function ProtectedRoute({ children, role, permission }) {
  const { user, hasPermission } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (role === 'admin' && !['super-admin', 'notaris', 'staff'].includes(user.role))
    return <Navigate to="/client/dashboard" replace />
  if (role === 'client' && !['klien'].includes(user.role))
    return <Navigate to="/admin/dashboard" replace />
  if (permission && !hasPermission(permission))
    return <Navigate to="/admin/dashboard" replace />
  return children
}

export default function App() {
  const { user, initiallyChecking, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (initiallyChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-primary-200 text-sm">Memeriksa sesi Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/track" element={<PublicTrack />} />
        <Route path="/track/:code" element={<PublicTrack />} />
        <Route path="/login" element={
          user
            ? <Navigate to={['klien'].includes(user.role) ? '/client/dashboard' : '/admin/dashboard'} replace />
            : <LoginPage />
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="documents/create" element={<AdminDocumentCreate />} />
          <Route path="documents/:id" element={<AdminDocumentDetail />} />
          <Route path="ajb/:id" element={<AdminAjbDetail />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="rbac" element={<ProtectedRoute role="admin" permission="rbac.manage"><AdminRbac /></ProtectedRoute>} />
          <Route path="order-mapping" element={<ProtectedRoute role="admin" permission="settings.edit"><AdminOrderMapping /></ProtectedRoute>} />
        </Route>

        {/* Client */}
        <Route path="/client" element={
          <ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="documents" element={<ClientDocuments />} />
          <Route path="documents/:id" element={<ClientDocumentDetail />} />
          <Route path="notifications" element={<ClientNotifications />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
