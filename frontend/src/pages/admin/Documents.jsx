import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  draft:       'badge-gray',
  in_progress: 'badge-blue',
  review:      'badge-yellow',
  completed:   'badge-green',
  cancelled:   'badge-red',
}
const STATUS_LABELS = { draft: 'Draft', in_progress: 'Diproses', review: 'Review', completed: 'Selesai', cancelled: 'Batal' }
const PRIORITY_STYLES = { low: 'badge-gray', normal: 'badge-blue', high: 'badge-yellow', urgent: 'badge-red' }
const PRIORITY_LABELS = { low: 'Rendah', normal: 'Normal', high: 'Tinggi', urgent: 'Urgent' }
const CATEGORY_STYLES = { notaris: 'badge-purple', ppat: 'badge-blue' }
const CATEGORY_LABELS = { notaris: 'Notaris', ppat: 'PPAT' }

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/documents', { params: { search, status, category, page } })
      setDocuments(res.data.data)
      setMeta(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [search, status, category, page])

  const handleDelete = async (id, title) => {
    if (!confirm(`Hapus order "${title}"?`)) return
    try {
      await api.delete(`/admin/documents/${id}`)
      toast.success('Order dihapus')
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Order</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola semua order notaris</p>
        </div>
        <Link to="/admin/documents/create" className="btn-primary">
          <Plus size={18} /> Tambah Order
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Cari order, nomor, klien..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
          <option value="">Semua Kategori</option>
          <option value="notaris">Notaris</option>
          <option value="ppat">PPAT</option>
        </select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FileText size={40} className="mb-2 opacity-30" />
            <p>Tidak ada order ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">No.Order</th>
                  <th className="text-left px-4 py-3">Judul & Jenis</th>
                  <th className="text-left px-4 py-3">Klien</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Prioritas</th>
                  <th className="text-left px-4 py-3">SLA</th>
                  <th className="text-left px-4 py-3">Deadline</th>
                  <th className="text-left px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-600">{doc.doc_number}</p>
                      <p className="text-xs text-gray-400">{doc.tracking_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{doc.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                        {doc.document_type?.name}
                        {doc.document_type?.category && (
                          <span className={CATEGORY_STYLES[doc.document_type.category] ?? 'badge-gray'}>
                            {CATEGORY_LABELS[doc.document_type.category] ?? doc.document_type.category}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{doc.client?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_STYLES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={PRIORITY_STYLES[doc.priority]}>{PRIORITY_LABELS[doc.priority]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {doc.document_type?.sla_days ? `${doc.document_type.sla_days} hari` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {doc.deadline ? new Date(doc.deadline).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/documents/${doc.id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors">
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Menampilkan {meta.from}–{meta.to} dari {meta.total} order</p>
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
