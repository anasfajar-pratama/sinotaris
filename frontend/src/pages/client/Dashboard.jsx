import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../stores/authStore'
import { FileText, Clock, CheckCircle, ArrowRight } from 'lucide-react'

const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }
const STATUS_STYLES = { draft: 'badge-gray', in_progress: 'badge-blue', review: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/client/dashboard').then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-6 text-white">
        <p className="text-primary-200 text-sm">Selamat datang kembali,</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
        <p className="text-primary-200 text-sm mt-2">Pantau status dokumen notaris Anda secara real-time</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{data?.total_documents ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Dokumen</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{data?.active_documents ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Sedang Diproses</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{data?.completed_documents ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Selesai</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Dokumen Terbaru Saya</h2>
          <Link to="/client/documents" className="text-sm text-primary-700 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        {data?.recent_documents?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>Belum ada dokumen</p>
            <p className="text-sm mt-1">Hubungi kantor kami untuk memulai proses dokumen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.recent_documents?.map((doc) => (
              <Link key={doc.id} to={`/client/documents/${doc.id}`} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-500">{doc.doc_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                  <p className="text-xs text-gray-400 mt-1">Tahap {doc.current_stage}/5</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Lacak Dokumen</h2>
        <p className="text-sm text-gray-600 mb-3">Masukkan kode tracking untuk melihat status dokumen Anda</p>
        <form onSubmit={(e) => { e.preventDefault(); const code = e.target.code.value; if (code) window.open(`/track/${code}`, '_blank') }}>
          <div className="flex gap-2">
            <input name="code" className="input flex-1" placeholder="Masukkan kode tracking..." />
            <button type="submit" className="btn-primary">Cek Status</button>
          </div>
        </form>
      </div>
    </div>
  )
}
