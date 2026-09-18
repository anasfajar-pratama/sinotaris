import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, Eye, FileCheck } from 'lucide-react'

const SOURCE_LABELS = { bank: 'Bank', notaris: 'Notaris', walk_in: 'Walk-in' }
const STATUS_STYLES = { active: 'badge-blue', on_hold: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }
const STATUS_LABELS = { active: 'Aktif', on_hold: 'Ditahan', completed: 'Selesai', cancelled: 'Batal' }

export default function AdminAjb() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/ajb', { params: { search, status, page } })
      setCases(res.data.data)
      setMeta(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [search, status, page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Order</h1>
          <p className="text-gray-500 text-sm mt-1">Pantau semua kasus Akta Jual Beli</p>
        </div>
        <Link to="/admin/ajb/create" className="btn-primary">
          <Plus size={18} /> Buat Kasus AJB
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Cari nomor kasus..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" /></div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FileCheck size={40} className="mb-2 opacity-30" />
            <p>Tidak ada kasus AJB ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">No. Kasus</th>
                  <th className="text-left px-4 py-3">Klien</th>
                  <th className="text-left px-4 py-3">Sumber</th>
                  <th className="text-left px-4 py-3">Progress</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Dibuat</th>
                  <th className="text-left px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.case_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.document?.client?.name ?? '—'}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray">{SOURCE_LABELS[c.source_type]}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.round((c.current_step / 8) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-10">{c.current_step}/8</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={STATUS_STYLES[c.status]}>{STATUS_LABELS[c.status]}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/ajb/${c.id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors inline-flex">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Total {meta.total} kasus</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">←</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= meta.last_page} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
