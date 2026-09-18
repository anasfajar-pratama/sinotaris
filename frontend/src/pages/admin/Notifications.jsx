import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Bell, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await api.get('/admin/notifications')
      setNotifications(res.data.data ?? res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`)
      setNotifications((n) => n.map((item) => item.id === id ? { ...item, is_read: true } : item))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/admin/notifications/read-all')
      setNotifications((n) => n.map((item) => ({ ...item, is_read: true })))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch {}
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-gray-500 text-sm mt-1">{unread} notifikasi belum dibaca</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck size={16} /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Bell size={40} className="mb-2 opacity-30" />
            <p>Tidak ada notifikasi</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 flex-shrink-0">
                  <Check size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
